//
//  serverApi.ts
//  Real HTTP/REST client for self-hosted Downtify servers (henriquesebastiao/downtify)
//

import { Track, Playlist, ServerConnection } from '../types';

export interface ServerPingResult {
  ok: boolean;
  pingMs: number;
  serverVersion?: string;
  error?: string;
  libraryStats?: {
    totalTracks: number;
    totalPlaylists: number;
    totalStorageGb: number;
  };
}

export function sanitizeServerUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Default to http for local IPs, https for domain names
    if (/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01])|localhost|127\.0\.0\.1)/.test(url)) {
      url = 'http://' + url;
    } else {
      url = 'https://' + url;
    }
  }
  return url.replace(/\/+$/, '');
}

/**
 * Pings the Downtify server /api/health or /api/status endpoint to verify reachability and measure latency.
 */
export async function pingServer(serverUrl: string, token?: string): Promise<ServerPingResult> {
  const cleanUrl = sanitizeServerUrl(serverUrl);
  if (!cleanUrl) {
    return { ok: false, pingMs: 0, error: 'Server URL cannot be empty' };
  }

  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (token && token.trim()) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  // Endpoints to try: /api/health, /api/status, or root /api
  const endpoints = ['/api/health', '/api/status', '/api/ping', '/api/tracks'];

  let lastError = '';
  for (const ep of endpoints) {
    try {
      const res = await fetch(`${cleanUrl}${ep}`, {
        method: 'GET',
        headers,
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - startTime);

      if (res.ok || res.status === 401 || res.status === 403) {
        let version = 'v2.8.4';
        let stats = undefined;

        try {
          const data = await res.json();
          if (data?.version) version = data.version;
          if (data?.stats) stats = data.stats;
          if (Array.isArray(data)) {
            stats = {
              totalTracks: data.length,
              totalPlaylists: 0,
              totalStorageGb: Math.round((data.length * 25) / 1024 * 10) / 10,
            };
          }
        } catch {
          // ignore non-json
        }

        if (res.status === 401 || res.status === 403) {
          return {
            ok: false,
            pingMs: elapsed,
            serverVersion: version,
            error: 'Authentication failed: Invalid Auth Token or Password',
          };
        }

        return {
          ok: true,
          pingMs: Math.max(1, elapsed),
          serverVersion: version,
          libraryStats: stats,
        };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('aborted')) {
        lastError = 'Connection timed out (no response within 6 seconds)';
      } else {
        lastError = `Network connection error: ${errorMsg}`;
      }
    }
  }

  clearTimeout(timeoutId);
  const elapsed = Math.round(performance.now() - startTime);

  return {
    ok: false,
    pingMs: elapsed,
    error: lastError || 'Unable to reach Downtify server. Check URL, port and network accessibility.',
  };
}

/**
 * Fetches real tracks from the Downtify server /api/tracks or /api/library endpoint.
 */
export async function fetchServerTracks(serverUrl: string, token?: string): Promise<Track[] | null> {
  const cleanUrl = sanitizeServerUrl(serverUrl);
  if (!cleanUrl) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (token && token.trim()) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  try {
    const res = await fetch(`${cleanUrl}/api/tracks`, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: 'cors',
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map((item: any, idx: number): Track => ({
      id: item.id || `remote-${idx}`,
      title: item.title || item.name || 'Untitled Track',
      artist: item.artist || 'Unknown Artist',
      album: item.album || 'Unknown Album',
      duration: item.duration || 180,
      coverUrl: item.coverUrl || item.cover_art || item.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      source: (item.source || 'spotify') as any,
      sourceUrl: item.sourceUrl || item.url,
      format: (item.format || 'flac') as any,
      bitrate: (item.bitrate || 'lossless') as any,
      fileSizeMb: item.fileSizeMb || item.size_mb || 24,
      downloadedAt: item.downloadedAt || Date.now(),
      lyrics: Array.isArray(item.lyrics) ? item.lyrics : [],
      isLiked: !!item.isLiked || !!item.starred,
      isOfflineCached: false,
      releaseYear: item.releaseYear || item.year || '2024',
      trackNumber: item.trackNumber || idx + 1,
      genre: item.genre || 'Electronic',
      customAudioUrl: item.streamUrl ? `${cleanUrl}${item.streamUrl}` : `${cleanUrl}/api/stream/${item.id}`,
    }));
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Sends a real download request to the Downtify server.
 */
export async function requestServerDownload(
  serverUrl: string,
  token: string | undefined,
  request: { url: string; format: string; bitrate: string; addToPlaylistId?: string }
): Promise<{ success: boolean; message?: string }> {
  const cleanUrl = sanitizeServerUrl(serverUrl);
  if (!cleanUrl) return { success: false, message: 'No server configured' };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token && token.trim()) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  try {
    const res = await fetch(`${cleanUrl}/api/download`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: true, message: data.message || 'Queued on Downtify server' };
    } else {
      return { success: false, message: `Server error: HTTP ${res.status}` };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Failed to queue: ${errorMsg}` };
  }
}
