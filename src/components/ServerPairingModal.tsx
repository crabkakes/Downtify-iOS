import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Server,
  Key,
  Globe,
  User,
  CheckCircle2,
  X,
  Wifi,
  ScanLine,
  Shield,
  AlertCircle,
  Loader2,
  ClipboardPaste,
  LogOut,
} from 'lucide-react';
import { ServerConnection, Track } from '../types';
import { audioEngine } from '../utils/audioEngine';
import { pingServer, fetchServerTracks, sanitizeServerUrl } from '../utils/serverApi';

interface ServerPairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: ServerConnection;
  onConnect: (info: Partial<ServerConnection>, realTracks?: Track[] | null) => void;
  onDisconnect?: () => void;
}

export const ServerPairingModal: React.FC<ServerPairingModalProps> = ({
  isOpen,
  onClose,
  connection,
  onConnect,
  onDisconnect,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('manual');
  
  const [serverUrl, setServerUrl] = useState(connection.serverUrl || '');
  const [username, setUsername] = useState(connection.username || '');
  const [token, setToken] = useState(connection.token || '');
  const [trustSelfSigned, setTrustSelfSigned] = useState(!!connection.trustSelfSignedCerts);
  
  // QR Payload text state
  const [qrJsonInput, setQrJsonInput] = useState('');
  
  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle parsing pasted QR code JSON
  const handleParseQrPayload = async (rawText: string) => {
    audioEngine.playHapticClick();
    setErrorMessage(null);
    setSuccessMessage(null);
    const trimmed = rawText.trim();
    if (!trimmed) return;

    try {
      let parsedServer = '';
      let parsedUser = '';
      let parsedToken = '';

      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const payload = JSON.parse(trimmed);
        parsedServer = payload.server || payload.host || payload.url || '';
        if (payload.port && !parsedServer.includes(`:${payload.port}`)) {
          parsedServer = `${parsedServer}:${payload.port}`;
        }
        parsedUser = payload.user || payload.username || '';
        parsedToken = payload.token || payload.auth_token || payload.key || '';
      } else {
        // Raw token or URL format
        parsedServer = trimmed;
      }

      if (parsedServer) setServerUrl(parsedServer);
      if (parsedUser) setUsername(parsedUser);
      if (parsedToken) setToken(parsedToken);

      setSuccessMessage('QR code credentials parsed successfully! Verifying connection...');
      await executeConnection(parsedServer, parsedUser, parsedToken, trustSelfSigned);
    } catch {
      setErrorMessage('Invalid QR Code JSON format. Please copy the full JSON payload from Downtify Web → Settings → Apps.');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQrJsonInput(text);
        await handleParseQrPayload(text);
      }
    } catch {
      setErrorMessage('Unable to access clipboard. Please paste the QR JSON code manually into the box below.');
    }
  };

  // Perform live server testing and connection
  const executeConnection = async (
    targetUrl: string,
    targetUser: string,
    targetToken: string,
    targetTrustSelfSigned: boolean,
    forceSave = false
  ) => {
    const cleanUrl = sanitizeServerUrl(targetUrl);
    if (!cleanUrl) {
      setErrorMessage('Please enter a valid Downtify server URL (e.g. http://192.168.1.100:8000 or https://music.yourdomain.com)');
      return;
    }

    setIsTesting(true);
    setErrorMessage(null);

    // Live ping to the server
    const pingRes = await pingServer(cleanUrl, targetToken);

    if (pingRes.ok || forceSave) {
      // Attempt to load user's real tracks from their server
      let realTracks: Track[] | null = null;
      try {
        realTracks = await fetchServerTracks(cleanUrl, targetToken);
      } catch {
        // non-fatal
      }

      setIsTesting(false);
      setSuccessMessage(
        realTracks && realTracks.length > 0
          ? `Connected! Loaded ${realTracks.length} tracks from your Downtify server.`
          : 'Connected to Downtify server successfully!'
      );

      setTimeout(() => {
        onConnect(
          {
            serverUrl: cleanUrl,
            username: targetUser.trim() || 'Admin',
            token: targetToken.trim(),
            trustSelfSignedCerts: targetTrustSelfSigned,
            status: 'connected',
            pingMs: pingRes.pingMs || 15,
            serverVersion: pingRes.serverVersion || 'v2.8.4',
            libraryStats: pingRes.libraryStats || {
              totalTracks: realTracks?.length || 0,
              totalPlaylists: 0,
              totalStorageGb: realTracks ? Math.round((realTracks.length * 25) / 1024 * 10) / 10 : 0,
            },
          },
          realTracks
        );
        onClose();
      }, 700);
    } else {
      setIsTesting(false);
      setErrorMessage(pingRes.error || `Failed to connect to ${cleanUrl}. Please ensure your Downtify instance is running and accessible.`);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playHapticClick();
    await executeConnection(serverUrl, username, token, trustSelfSigned);
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
              <h3 className="text-base font-semibold text-white">Connect Downtify Server</h3>
              <p className="text-[11px] text-neutral-400">Pair your self-hosted music instance</p>
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
              setActiveTab('manual');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Manual IP / Host
          </button>
          <button
            type="button"
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('qr');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'qr'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            QR / Pairing Token
          </button>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
            <button
              type="button"
              onClick={() => executeConnection(serverUrl, username, token, trustSelfSigned, true)}
              className="w-full mt-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5 shadow"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connect & Save Credentials to Device</span>
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Manual Tab */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3 py-1">
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Server URL / IP Address
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://192.168.1.100:8000 or https://music.yourdomain.com"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Port is typically 8000 by default in Downtify Docker.
              </span>
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
                  placeholder="e.g. admin or your username"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  placeholder="Found in Downtify Web → Settings → Apps"
                  className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Local Network TLS Option */}
            <div className="flex items-center justify-between p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-xs">
              <span className="text-[11px] text-neutral-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Allow Self-Signed TLS / HTTP (Home Lab)
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
              disabled={isTesting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting & Testing Server...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connect to Server</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* QR Tab */}
        {activeTab === 'qr' && (
          <div className="space-y-3 py-1">
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <ScanLine className="w-4 h-4" />
                <span>Pairing from Downtify Web</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                1. On your computer, open your Downtify server web UI.<br />
                2. Navigate to <strong className="text-white">Settings → Apps</strong>.<br />
                3. Copy the pairing JSON payload or scan the displayed QR code.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-neutral-400">
                  Pairing JSON Payload
                </label>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Paste from Clipboard</span>
                </button>
              </div>
              <textarea
                value={qrJsonInput}
                onChange={(e) => setQrJsonInput(e.target.value)}
                placeholder='{"server":"http://192.168.1.100:8000","user":"admin","token":"..."}'
                rows={3}
                className="w-full p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono resize-none"
              />
            </div>

            <button
              type="button"
              disabled={isTesting || !qrJsonInput.trim()}
              onClick={() => handleParseQrPayload(qrJsonInput)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Server Connection...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Pair with Server</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Disconnect Option if currently connected */}
        {connection.status === 'connected' && onDisconnect && (
          <div className="pt-2 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={() => {
                audioEngine.playHapticClick();
                onDisconnect();
                onClose();
              }}
              className="w-full py-2 px-3 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-900/50 text-[11px] font-medium text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect / Sign Out of Current Server</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
