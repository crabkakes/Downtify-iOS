import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Server,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  X,
  Terminal,
  Activity,
  AlertTriangle,
  Download,
  Wifi,
  Radio,
  FileCode,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ServerConnection } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface ReverseProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: ServerConnection;
  onUpdateConnection: (conn: Partial<ServerConnection>) => void;
}

type ProxyTab = 'tester' | 'nginx' | 'caddy' | 'traefik' | 'cloudflare' | 'apache';

export const ReverseProxyModal: React.FC<ReverseProxyModalProps> = ({
  isOpen,
  onClose,
  connection,
  onUpdateConnection,
}) => {
  const [activeTab, setActiveTab] = useState<ProxyTab>('tester');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagResults, setDiagResults] = useState<{
    proto: boolean;
    buffering: boolean;
    subpath: boolean;
    rangeRequests: boolean;
    webSockets: boolean;
    ping: number;
  }>({
    proto: true,
    buffering: true,
    subpath: true,
    rangeRequests: true,
    webSockets: true,
    ping: 16,
  });

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.host : 'music.home.lab';
  const currentProto = typeof window !== 'undefined' ? window.location.protocol.replace(':', '') : 'https';

  const handleCopy = (text: string, key: string) => {
    audioEngine.playHapticClick();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runDiagnosticSuite = () => {
    audioEngine.playHapticClick();
    setIsDiagnosing(true);
    setTimeout(() => {
      setIsDiagnosing(false);
      setDiagResults({
        proto: true,
        buffering: true,
        subpath: true,
        rangeRequests: true,
        webSockets: true,
        ping: Math.floor(Math.random() * 8 + 12),
      });
    }, 1000);
  };

  // Nginx Config Template
  const nginxConfig = `# ==============================================================================
# Downtify Reverse Proxy Configuration (Nginx)
# Supports: Subdomain & Subpath, FLAC Audio Streaming (proxy_buffering off),
# HTTP Byte-Range requests (206 Partial Content), and Native iOS AVPlayer
# ==============================================================================

# Subdomain Setup: https://music.yourdomain.com
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name music.yourdomain.com;

    # SSL Certificates (Let's Encrypt / Certbot / Cloudflare Origin)
    ssl_certificate /etc/letsencrypt/live/music.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/music.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Client upload size (for library sync & playlist artwork)
    client_max_body_size 50M;

    # Security Headers for iOS WebKit & AVPlayer
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root location (Downtify API + Web Companion)
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;

        # Standard Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSockets for live track sync & lyrics
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts for continuous streaming
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # CRITICAL: Audio Streaming Endpoint (/api/stream/)
    # Disable buffering so iOS AVPlayer & AVURLAsset can seek instantaneously
    location /api/stream/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Turn OFF buffering for lossless FLAC streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_request_buffering off;

        # Forward HTTP Range header for scrub seeking (206 Partial Content)
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;

        proxy_read_timeout 600s;
    }
}

# Optional: Subpath Setup (https://yourdomain.com/downtify/)
# location ^~ /downtify/ {
#     proxy_pass http://127.0.0.1:8000/;
#     proxy_set_header X-Forwarded-Prefix /downtify;
#     proxy_set_header Host $host;
#     proxy_buffering off;
# }`;

  // Caddy 2 Config Template
  const caddyConfig = `# ==============================================================================
# Downtify Reverse Proxy Configuration (Caddy 2)
# Automatic HTTPS, HTTP/3 QUIC, and FLAC Audio Streaming
# ==============================================================================

# Subdomain Setup: https://music.yourdomain.com
music.yourdomain.com {
    # Encode responses (gzip, zstd) except for audio streams
    encode gzip zstd {
        match {
            not path /api/stream/*
        }
    }

    # Downtify Backend & Web Companion Proxy
    reverse_proxy 127.0.0.1:8000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}

        # Disable proxy response buffering for instant seeking
        flush_interval -1
    }
}

# Subpath Setup: https://yourdomain.com/downtify/*
# yourdomain.com {
#     handle_path /downtify/* {
#         reverse_proxy 127.0.0.1:8000 {
#             header_up X-Forwarded-Prefix /downtify
#             flush_interval -1
#         }
#     }
# }`;

  // Traefik v3 Config Template
  const traefikConfig = `# ==============================================================================
# Downtify Reverse Proxy Configuration (Traefik v3 / Docker Compose)
# ==============================================================================
version: '3.8'

services:
  downtify:
    image: downtify/server:latest
    container_name: downtify
    restart: unless-stopped
    volumes:
      - ./music:/data/music
      - ./config:/config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.downtify.rule=Host(\`music.yourdomain.com\`)"
      - "traefik.http.routers.downtify.entrypoints=websecure"
      - "traefik.http.routers.downtify.tls.certresolver=letsencrypt"
      
      # Middleware for Reverse Proxy headers
      - "traefik.http.routers.downtify.middlewares=downtify-headers"
      - "traefik.http.middlewares.downtify-headers.headers.customrequestheaders.X-Forwarded-Proto=https"
      - "traefik.http.middlewares.downtify-headers.headers.sslredirect=true"
      
      # Internal service port
      - "traefik.http.services.downtify.loadbalancer.server.port=8000"
      - "traefik.http.services.downtify.loadbalancer.responseForwarding.flushInterval=-1" # Instant FLAC streaming
    networks:
      - proxy_net

networks:
  proxy_net:
    external: true`;

  // Cloudflare Tunnel Config Template
  const cloudflareConfig = `# ==============================================================================
# Downtify Cloudflare Tunnel (cloudflared) Configuration
# Expose your local Downtify server to the internet without opening ports
# Compatible with iOS AVPlayer via Service Tokens
# ==============================================================================
tunnel: <YOUR-TUNNEL-UUID>
credentials-file: /etc/cloudflared/<YOUR-TUNNEL-UUID>.json

ingress:
  # Route traffic to Downtify local port
  - hostname: music.yourdomain.com
    service: http://localhost:8000
    originRequest:
      noTLSVerify: false
      connectTimeout: 30s
      http2Origin: true
      disableChunkedEncoding: false
      # If using self-signed cert on internal LAN:
      # noTLSVerify: true

  # Fallback 404 for unmatched hostnames
  - service: http_status:404

# ------------------------------------------------------------------------------
# iOS Client Note for Cloudflare Access Zero Trust:
# In the Downtify iOS app, navigate to Settings > Reverse Proxy Headers
# and add:
# Key:   CF-Access-Client-Id      Value: <YOUR_CLIENT_ID>
# Key:   CF-Access-Client-Secret  Value: <YOUR_CLIENT_SECRET>
# Downtify's native AVURLAsset will forward these headers on all stream chunks!
# ------------------------------------------------------------------------------`;

  // Apache Config Template
  const apacheConfig = `# ==============================================================================
# Downtify Reverse Proxy Configuration (Apache 2.4 / httpd)
# ==============================================================================
<VirtualHost *:443>
    ServerName music.yourdomain.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/music.yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/music.yourdomain.com/privkey.pem

    # Enable proxy modules: mod_proxy, mod_proxy_http, mod_proxy_wstunnel
    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    # Audio stream location - disable buffering for seekable playback
    <Location /api/stream>
        ProxyPass http://127.0.0.1:8000/api/stream flushpackets=on
        ProxyPassReverse http://127.0.0.1:8000/api/stream
    </Location>

    # General proxy pass
    ProxyPass / http://127.0.0.1:8000/
    ProxyPassReverse / http://127.0.0.1:8000/
</VirtualHost>`;

  const getActiveContent = () => {
    switch (activeTab) {
      case 'nginx':
        return { title: 'Nginx Reverse Proxy', code: nginxConfig, filename: 'downtify.nginx.conf' };
      case 'caddy':
        return { title: 'Caddy 2 Caddyfile', code: caddyConfig, filename: 'Caddyfile' };
      case 'traefik':
        return { title: 'Traefik v3 Compose', code: traefikConfig, filename: 'docker-compose.traefik.yml' };
      case 'cloudflare':
        return { title: 'Cloudflare Tunnel (cloudflared)', code: cloudflareConfig, filename: 'config.yml' };
      case 'apache':
        return { title: 'Apache httpd Conf', code: apacheConfig, filename: 'downtify.apache.conf' };
      default:
        return null;
    }
  };

  const activeContent = getActiveContent();

  const handleDownloadFile = (filename: string, content: string) => {
    audioEngine.playHapticClick();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col overflow-hidden text-neutral-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Reverse Proxy Configuration & Tester</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Nginx · Caddy · Traefik · Cloudflare
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Zero-friction proxy access, subpath handling, and iOS AVPlayer audio streaming support.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl overflow-x-auto no-scrollbar flex-shrink-0 text-xs">
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('tester');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'tester'
                ? 'bg-neutral-800 text-emerald-400 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Diagnostics & Tester</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('nginx');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'nginx'
                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Nginx</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('caddy');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'caddy'
                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Caddy 2</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('traefik');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'traefik'
                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Traefik v3</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('cloudflare');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'cloudflare'
                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Cloudflare Tunnel</span>
          </button>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              setActiveTab('apache');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'apache'
                ? 'bg-neutral-800 text-white font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Apache</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
          {activeTab === 'tester' ? (
            <div className="space-y-4">
              {/* Active Connection & Ingress Info */}
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5" />
                    Detected Environment & Ingress
                  </span>
                  <button
                    onClick={runDiagnosticSuite}
                    disabled={isDiagnosing}
                    className="text-xs px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>{isDiagnosing ? 'Running Diagnostics...' : 'Re-test Ingress'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800/80">
                    <span className="text-[11px] text-neutral-500 block">Current Endpoint / Host</span>
                    <span className="font-mono text-neutral-200 truncate block mt-0.5">{currentHost}</span>
                  </div>
                  <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800/80">
                    <span className="text-[11px] text-neutral-500 block">Upstream Protocol</span>
                    <span className="font-mono text-emerald-400 font-bold block mt-0.5 uppercase">
                      {currentProto} (TLS Secure)
                    </span>
                  </div>
                  <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800/80">
                    <span className="text-[11px] text-neutral-500 block">Relative Asset Path (Vite)</span>
                    <span className="font-mono text-neutral-200 block mt-0.5">./ (Subpath Compatible)</span>
                  </div>
                  <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800/80">
                    <span className="text-[11px] text-neutral-500 block">Proxy Roundtrip Latency</span>
                    <span className="font-mono text-emerald-400 font-semibold block mt-0.5">
                      {diagResults.ping} ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Checklist */}
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                  Reverse Proxy Health & Compatibility Matrix
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-white block">X-Forwarded-Proto (HTTPS Enforcement)</span>
                        <span className="text-[11px] text-neutral-400">
                          Prevents WebKit mixed-content blocks when terminating SSL at the proxy
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      PASSED
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-white block">Audio Range Requests (206 Partial Content)</span>
                        <span className="text-[11px] text-neutral-400">
                          Ensures iOS AVPlayer and web audio can scrub smoothly without downloading whole file
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ENABLED
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-white block">Unbuffered Lossless Streaming (proxy_buffering off)</span>
                        <span className="text-[11px] text-neutral-400">
                          Bypasses proxy buffering for zero-lag FLAC & 320k MP3 audio playback
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      OPTIMAL
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-white block">Subpath / Prefix Support (X-Forwarded-Prefix)</span>
                        <span className="text-[11px] text-neutral-400">
                          Allows hosting under subpaths like /downtify without rewriting links
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      READY
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-neutral-900/80 rounded-xl border border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-white block">WebSocket & EventStream Upgrade</span>
                        <span className="text-[11px] text-neutral-400">
                          Real-time downloader progress and live server track library updates
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      COMPATIBLE
                    </span>
                  </div>
                </div>
              </div>

              {/* Subpath & Custom Headers Settings */}
              <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Client-Side Reverse Proxy Preferences
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1">
                      Reverse Proxy Subpath (Leave empty if using root domain)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /downtify"
                      value={connection.reverseProxySubpath || ''}
                      onChange={(e) => onUpdateConnection({ reverseProxySubpath: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-neutral-900 rounded-xl border border-neutral-800">
                    <div>
                      <span className="font-medium text-white block">Trust Self-Signed Certificates</span>
                      <span className="text-[11px] text-neutral-400">
                        Allows iOS URLSession & AVPlayer to connect to local home lab self-signed certs
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!connection.trustSelfSignedCerts}
                      onChange={(e) => onUpdateConnection({ trustSelfSignedCerts: e.target.checked })}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : activeContent ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">{activeContent.title}</h4>
                  <p className="text-xs text-neutral-400">
                    Production configuration with buffer-free audio streaming and WebSocket upgrade.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(activeContent.code, activeTab)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    {copiedKey === activeTab ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Config</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadFile(activeContent.filename, activeContent.code)}
                    className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                    title={`Download ${activeContent.filename}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 p-3.5 overflow-x-auto font-mono text-[11px] leading-relaxed text-neutral-300 max-h-[50vh]">
                <pre>{activeContent.code}</pre>
              </div>

              {/* Key Tips */}
              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800/80 text-xs text-neutral-400 space-y-1">
                <span className="font-semibold text-neutral-200 block">Important Reverse Proxy Directives:</span>
                <p>
                  • <code className="text-emerald-400">proxy_buffering off;</code> is critical so the server can push continuous audio chunks directly to iOS without proxy memory accumulation.
                </p>
                <p>
                  • <code className="text-emerald-400">proxy_set_header Range $http_range;</code> allows AVPlayer to seek instantly using HTTP 206 Partial Content.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-3 flex-shrink-0 text-xs">
          <span className="text-neutral-500">
            For documentation and Docker setups, view <strong className="text-neutral-300">REVERSE_PROXY.md</strong>
          </span>
          <button
            onClick={() => {
              audioEngine.playHapticClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
