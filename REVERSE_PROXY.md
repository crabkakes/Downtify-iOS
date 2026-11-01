# Downtify Reverse Proxy Production Guide

This guide details how to host and connect **Downtify** (both the Web Companion and native iOS / Apple CarPlay client) securely behind modern reverse proxies, ingress controllers, and zero-trust tunnels.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │            Reverse Proxy Ingress             │
                      │  (Nginx / Caddy 2 / Traefik / Cloudflare)    │
                      └──────────────────────┬───────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
          [Web UI / Companion Client]                 [Audio Streaming Engine]
           • Relative assets (./)                      • proxy_buffering off;
           • Subdomain or Subpath                      • Range: bytes=... (206)
           • TLS termination                           • Continuous FLAC stream
```

### Critical Requirements for Audio Streaming & iOS AVPlayer
1. **Disabled Buffering (`proxy_buffering off` / `flush_interval -1`)**:
   Downtify streams real-time uncompressed or high-bitrate audio (Lossless FLAC, 320kbps MP3, AAC). If reverse proxy response buffering is left enabled, the proxy attempts to buffer the entire audio stream into RAM or disk before relaying it, causing playback stall, scrub delays, and memory exhaustion.
2. **Byte-Range Requests (`HTTP 206 Partial Content`)**:
   Apple's `AVPlayer` and `AVURLAsset` require HTTP byte-range requests to scrub, fast-forward, and seek. Proxies must forward `Range` and `If-Range` headers without stripping them.
3. **Subpath Handling (`X-Forwarded-Prefix`)**:
   Downtify supports both dedicated subdomains (e.g., `https://music.example.com`) and subpaths (e.g., `https://example.com/downtify/`). Asset bundling in Vite uses relative paths (`./`) so no broken asset URLs occur.
4. **WebSocket & SSE Upgrade**:
   Downtify uses WebSockets and Server-Sent Events (SSE) for live server library synchronization, download progress, and time-synced lyrics.

---

## 1. Nginx Configuration

Save this configuration as `/etc/nginx/sites-available/downtify.conf` and symlink to `sites-enabled`.

### Subdomain Setup (`https://music.yourdomain.com`)
```nginx
# Upstream Downtify server (adjust host/port as needed)
upstream downtify_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name music.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name music.yourdomain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/music.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/music.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security Headers for WebKit & iOS
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 100M;

    # 1. Main Application & API Gateway
    location / {
        proxy_pass http://downtify_backend;
        proxy_http_version 1.1;

        # Standard Forwarding Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSockets for live lyrics & download tasks
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout 86400s;
        proxy_read_timeout 86400s;
    }

    # 2. Audio Streaming Endpoint (AVPlayer & Lossless FLAC)
    location /api/stream/ {
        proxy_pass http://downtify_backend;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CRITICAL: Disable buffering for instant audio streaming & scrubbing
        proxy_buffering off;
        proxy_cache off;
        proxy_request_buffering off;

        # Pass HTTP Range headers for scrubbing (206 Partial Content)
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;

        # Keep streaming connection alive
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

### Subpath Setup (`https://yourdomain.com/downtify/`)
```nginx
# Subpath location inside your existing server block:
location ^~ /downtify/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /downtify;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Audio streaming optimization
    proxy_buffering off;
    proxy_set_header Range $http_range;
}
```

---

## 2. Caddy 2 Configuration

Caddy provides automatic HTTPS with Let's Encrypt or ZeroSSL, HTTP/3 (QUIC) support, and simplified configuration.

### Subdomain Setup (`Caddyfile`)
```caddy
music.yourdomain.com {
    # Encode web assets, bypass compression on binary audio streams
    encode gzip zstd {
        match {
            not path /api/stream/*
        }
    }

    # Proxy to Downtify
    reverse_proxy 127.0.0.1:8000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}

        # Disable response buffering for instantaneous FLAC playback
        flush_interval -1
    }
}
```

### Subpath Setup (`https://yourdomain.com/downtify/*`)
```caddy
yourdomain.com {
    handle_path /downtify/* {
        reverse_proxy 127.0.0.1:8000 {
            header_up X-Forwarded-Prefix /downtify
            flush_interval -1
        }
    }
}
```

---

## 3. Traefik v3 (Docker Compose)

Add Downtify to your Docker Compose stack with Traefik container labels:

```yaml
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
      
      # Routing
      - "traefik.http.routers.downtify.rule=Host(`music.yourdomain.com`)"
      - "traefik.http.routers.downtify.entrypoints=websecure"
      - "traefik.http.routers.downtify.tls=true"
      - "traefik.http.routers.downtify.tls.certresolver=letsencrypt"
      
      # Middlewares: Headers & SSL Redirect
      - "traefik.http.routers.downtify.middlewares=downtify-headers"
      - "traefik.http.middlewares.downtify-headers.headers.customrequestheaders.X-Forwarded-Proto=https"
      - "traefik.http.middlewares.downtify-headers.headers.sslredirect=true"
      
      # Upstream Load Balancer & Unbuffered Audio Streaming
      - "traefik.http.services.downtify.loadbalancer.server.port=8000"
      - "traefik.http.services.downtify.loadbalancer.responseForwarding.flushInterval=-1"
    networks:
      - proxy_network

networks:
  proxy_network:
    external: true
```

---

## 4. Cloudflare Tunnel (`cloudflared`)

Cloudflare Tunnel lets you publish your self-hosted Downtify instance to the internet without opening firewall ports.

### `config.yml`
```yaml
tunnel: 4e29cb11-923f-48d5-b605-09123847abcd
credentials-file: /etc/cloudflared/4e29cb11-923f-48d5-b605-09123847abcd.json

ingress:
  - hostname: music.yourdomain.com
    service: http://localhost:8000
    originRequest:
      noTLSVerify: false
      connectTimeout: 30s
      http2Origin: true
      disableChunkedEncoding: false
      # For local self-signed certificates:
      # noTLSVerify: true

  - service: http_status:404
```

### Cloudflare Access (Zero Trust) Integration with iOS
If you protect your domain with Cloudflare Access Zero Trust:
1. In Cloudflare Zero Trust Dashboard, generate a **Service Token** (Client ID and Client Secret).
2. In the Downtify iOS App, open **Settings → Reverse Proxy & Headers**.
3. Add custom HTTP headers:
   - `CF-Access-Client-Id`: `<YOUR_CLIENT_ID>`
   - `CF-Access-Client-Secret`: `<YOUR_CLIENT_SECRET>`
4. Downtify's native `AVURLAsset` and `URLSession` will automatically inject these headers on all REST requests and audio stream chunk requests.

---

## 5. Apache 2.4 (`httpd`)

Enable required Apache modules:
```bash
sudo a2enmod proxy proxy_http proxy_wstunnel ssl headers rewrite
```

Configuration block:
```apache
<VirtualHost *:443>
    ServerName music.yourdomain.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/music.yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/music.yourdomain.com/privkey.pem

    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    # Streaming location - bypass buffering for real-time seekable audio
    <Location /api/stream>
        ProxyPass http://127.0.0.1:8000/api/stream flushpackets=on
        ProxyPassReverse http://127.0.0.1:8000/api/stream
    </Location>

    # WebSocket Upgrade
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://127.0.0.1:8000/$1 [P,L]

    # Standard reverse proxy
    ProxyPass / http://127.0.0.1:8000/
    ProxyPassReverse / http://127.0.0.1:8000/
</VirtualHost>
```

---

## 6. iOS Client Pairing Instructions

Connecting the native iOS / CarPlay client through a reverse proxy:

1. **Launch Downtify** on iOS.
2. Select **Manual Login** or scan the QR code from the Web Companion.
3. Enter your Reverse Proxy public URL:
   - Example: `https://music.yourdomain.com` or `https://yourdomain.com`
4. If using a subpath, expand **Reverse Proxy & Gateway** and enter the subpath (e.g., `/downtify`).
5. **Self-Signed Certificates (Local LAN / Home Labs)**:
   - If using `mkcert`, self-signed certificates, or an internal private CA on your home server, toggle on **Trust Self-Signed SSL (LAN / Home Lab)**.
   - Downtify uses a custom `ProxySSLSecurityDelegate` to validate the server trust challenge smoothly.
6. Tap **Connect to Server**.

---

## 7. Troubleshooting & Verification

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Audio takes 10+ seconds to start or stalls** | Reverse proxy response buffering is enabled | Add `proxy_buffering off;` (Nginx) or `flush_interval -1` (Caddy/Traefik). |
| **Cannot scrub or seek in AVPlayer** | Proxy strips `Range` header | Add `proxy_set_header Range $http_range;` in Nginx. |
| **Mixed Content Warning on Web Companion** | Missing `X-Forwarded-Proto: https` | Verify `X-Forwarded-Proto $scheme` header in proxy config. |
| **404 on assets when behind subpath** | Absolute paths used instead of relative | Downtify is pre-configured with `base: './'` in `vite.config.ts`. |
| **Cloudflare 524 Timeout on Long Tracks** | Proxy timeout exceeded | Increase `proxy_read_timeout` to `600s` or use WebSockets for continuous streams. |
| **SSL Handshake Failure on HomeLab** | Self-signed certificate rejected | Toggle "Trust Self-Signed SSL" in Downtify iOS settings. |
