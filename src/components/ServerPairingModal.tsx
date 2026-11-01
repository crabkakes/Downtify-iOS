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
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
} from 'lucide-react';
import { ServerConnection } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface ServerPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: ServerConnection;
  onConnect: (info: Partial<ServerConnection>) => void;
  onOpenReverseProxyGuide?: () => void;
}

export const ServerPairingModal: React.FC<ServerPairingModalProps> = ({
  isOpen,
  onClose,
  connection,
  onConnect,
  onOpenReverseProxyGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');
  const [serverUrl, setServerUrl] = useState(connection.serverUrl || 'https://downtify.local:8000');
  const [username, setUsername] = useState(connection.username || 'alex');
  const [token, setToken] = useState(connection.token || 'dt_auth_token_98234');
  const [showAdvancedProxy, setShowAdvancedProxy] = useState(false);
  const [subpath, setSubpath] = useState(connection.reverseProxySubpath || '');
  const [trustSelfSigned, setTrustSelfSigned] = useState(!!connection.trustSelfSignedCerts);
  const [cfClientId, setCfClientId] = useState(connection.customHeaders?.['CF-Access-Client-Id'] || '');
  const [cfClientSecret, setCfClientSecret] = useState(connection.customHeaders?.['CF-Access-Client-Secret'] || '');
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

    const customHeaders: Record<string, string> = {};
    if (cfClientId.trim()) customHeaders['CF-Access-Client-Id'] = cfClientId.trim();
    if (cfClientSecret.trim()) customHeaders['CF-Access-Client-Secret'] = cfClientSecret.trim();

    onConnect({
      serverUrl: serverUrl.trim(),
      username: username.trim(),
      token: token.trim(),
      reverseProxySubpath: subpath.trim(),
      trustSelfSignedCerts: trustSelfSigned,
      customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
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

            {/* Reverse Proxy & Subpath Expandable Settings */}
            <div className="border border-neutral-800/80 rounded-2xl p-2.5 bg-neutral-950/60">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playHapticClick();
                  setShowAdvancedProxy(!showAdvancedProxy);
                }}
                className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-emerald-400 font-medium transition-colors"
              >
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Reverse Proxy & Headers ({showAdvancedProxy ? 'Hide' : 'Configure'})
                </span>
                {showAdvancedProxy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvancedProxy && (
                <div className="mt-3 space-y-2.5 pt-2 border-t border-neutral-800 text-xs">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">
                      Subpath (e.g. /downtify or empty for root)
                    </label>
                    <input
                      type="text"
                      value={subpath}
                      onChange={(e) => setSubpath(e.target.value)}
                      placeholder="/downtify"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">
                      Cloudflare Access / Proxy Client ID
                    </label>
                    <input
                      type="text"
                      value={cfClientId}
                      onChange={(e) => setCfClientId(e.target.value)}
                      placeholder="CF-Access-Client-Id (Optional)"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-0.5">
                      Cloudflare Access / Proxy Client Secret
                    </label>
                    <input
                      type="password"
                      value={cfClientSecret}
                      onChange={(e) => setCfClientSecret(e.target.value)}
                      placeholder="CF-Access-Client-Secret (Optional)"
                      className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      Trust Self-Signed SSL (LAN)
                    </span>
                    <input
                      type="checkbox"
                      checked={trustSelfSigned}
                      onChange={(e) => setTrustSelfSigned(e.target.checked)}
                      className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {onOpenReverseProxyGuide && (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playHapticClick();
                        onOpenReverseProxyGuide();
                      }}
                      className="w-full mt-1 py-1.5 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-neutral-900 hover:bg-neutral-850 rounded-lg border border-neutral-800 transition-colors"
                    >
                      View Nginx / Caddy / Traefik configs →
                    </button>
                  )}
                </div>
              )}
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
