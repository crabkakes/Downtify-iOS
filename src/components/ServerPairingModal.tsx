import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode,
  Server,
  Key,
  Globe,
  User,
  CheckCircle2,
  X,
  Sparkles,
  Wifi,
  ScanLine,
  Shield,
} from 'lucide-react';
import { ServerConnection } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface ServerPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: ServerConnection;
  onConnect: (info: Partial<ServerConnection>) => void;
}

export const ServerPairingModal: React.FC<ServerPairingModalProps> = ({
  isOpen,
  onClose,
  connection,
  onConnect,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  const [serverUrl, setServerUrl] = useState(connection.serverUrl || 'https://downtify.local:8000');
  const [username, setUsername] = useState(connection.username || 'alex');
  const [token, setToken] = useState(connection.token || 'dt_auth_token_98234');
  const [trustSelfSigned, setTrustSelfSigned] = useState(!!connection.trustSelfSignedCerts);
  const [isScanning, setIsScanning] = useState(false);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    audioEngine.playHapticClick();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onConnect({
        serverUrl: 'https://downtify.home.lan:8000',
        username: 'alex',
        token: 'dt_qr_token_' + Math.random().toString(36).substring(2, 8),
        status: 'connected',
        pingMs: 14,
        serverVersion: 'v2.8.4',
        isDemo: false,
      });
      onClose();
    }, 1200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playHapticClick();

    // Security: Validate URL protocol to prevent arbitrary scheme injection
    let cleanUrl = serverUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    onConnect({
      serverUrl: cleanUrl,
      username: username.trim(),
      token: token.trim(),
      trustSelfSignedCerts: trustSelfSigned,
      status: 'connected',
      pingMs: Math.floor(Math.random() * 15 + 12),
      serverVersion: 'v2.8.4',
      isDemo: false,
    });
    onClose();
  };

  const handleDemoConnect = () => {
    audioEngine.playHapticClick();
    onConnect({
      serverUrl: 'https://demo.downtify.io',
      username: 'demo_user',
      token: 'demo_token_xyz',
      status: 'connected',
      pingMs: 18,
      serverVersion: 'v2.8.4',
      isDemo: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4 overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Connect to Downtify</h3>
              <p className="text-[11px] text-neutral-400">Self-Hosted Server Companion</p>
            </div>
          </div>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onClose();
            }}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pairing Mode Selector */}
        <div className="flex items-center p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('qr');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'qr'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Scan QR Code
          </button>
          <button
            type="button"
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('manual');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Manual Login
          </button>
        </div>

        {/* QR Tab */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center text-center space-y-3 py-2">
            {/* Simulated Viewfinder */}
            <div className="relative w-48 h-48 rounded-2xl border-2 border-dashed border-emerald-500/60 bg-neutral-950/80 flex flex-col items-center justify-center p-4 overflow-hidden">
              {isScanning ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  <span className="text-xs font-mono text-emerald-400">Pairing with server...</span>
                </div>
              ) : (
                <>
                  <QrCode className="w-14 h-14 text-emerald-400 mb-2 opacity-80" />
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Open your Downtify Web interface, go to:
                  </p>
                  <code className="text-[10px] font-mono text-emerald-300 bg-neutral-900 px-1.5 py-0.5 rounded mt-1">
                    Settings → Apps
                  </code>
                </>
              )}

              {/* Scanning beam effect */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[pulse_0.6s_ease-in-out_infinite] top-1/2" />
              )}
            </div>

            <button
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <ScanLine className="w-4 h-4" />
              <span>Simulate Scan Downtify QR Code</span>
            </button>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3 py-1">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Server URL
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://downtify.local:8000"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Auth Token or Password
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Server Auth Token"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Local Network Security Option */}
            <div className="flex items-center justify-between p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-xs">
              <span className="text-[11px] text-neutral-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Allow Self-Signed TLS (Local Home Server)
              </span>
              <input
                type="checkbox"
                checked={trustSelfSigned}
                onChange={(e) => setTrustSelfSigned(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Connect & Authenticate</span>
            </button>
          </form>
        )}

        {/* Demo Server Button */}
        <div className="pt-2 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={handleDemoConnect}
            className="w-full py-2 px-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-medium text-neutral-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Use Demo Downtify Server Instance</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
