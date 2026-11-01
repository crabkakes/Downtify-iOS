import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  className?: string;
  barColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  className = 'w-full h-12',
  barColor = '#10b981', // emerald-500
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const numBars = 24;
      const barWidth = (width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        let value = isPlaying ? freqData[i % freqData.length] || 0 : 4;
        if (!isPlaying) {
          value = 4 + Math.sin(Date.now() / 300 + i * 0.3) * 2;
        }

        const barHeight = Math.max(3, (value / 255) * height);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, barColor);
        grad.addColorStop(1, '#6ee7b7'); // emerald-300

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, barColor]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={40}
      className={`${className} rounded-lg`}
    />
  );
};
