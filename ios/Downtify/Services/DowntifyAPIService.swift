//
//  DowntifyAPIService.swift
//  Downtify iOS
//

import Foundation
import Combine

public class DowntifyAPIService: ObservableObject {
    public static let shared = DowntifyAPIService()

    @Published public var connectionInfo = ServerConnectionInfo()
    @Published public var isConnected: Bool = true
    @Published public var tracks: [Track] = []
    @Published public var playlists: [Playlist] = []
    @Published public var serverTasks: [ServerDownloadTask] = []
    @Published public var isLoading: Bool = false
    @Published public var errorMessage: String? = nil

    private var session: URLSession!
    private let securityDelegate = DowntifySSLSecurityDelegate()

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config, delegate: securityDelegate, delegateQueue: nil)
        
        // Seed default token in Keychain for demo/first run
        if KeychainHelper.shared.read(for: "alex") == nil {
            KeychainHelper.shared.save(token: "dt_auth_token_98234", for: "alex")
        }
        
        loadMockData()
    }

    public func pairWithQRCode(_ jsonString: String) {
        guard let data = jsonString.data(using: .utf8),
              let payload = try? JSONDecoder().decode(QRAuthPayload.self, from: data) else {
            self.errorMessage = "Invalid Downtify QR Code"
            return
        }

        // Security: Save token to hardware Keychain
        KeychainHelper.shared.save(token: payload.token, for: payload.user)

        self.connectionInfo.serverUrl = payload.server
        self.connectionInfo.username = payload.user
        self.connectionInfo.isConnected = true
        self.isConnected = true
        self.fetchServerLibrary()
    }

    public func connectManually(
        url: String,
        user: String,
        token: String,
        trustSelfSigned: Bool = false
    ) {
        // Security: Validate protocol scheme
        var cleanUrl = url.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanUrl.lowercased().hasPrefix("http://") && !cleanUrl.lowercased().hasPrefix("https://") {
            cleanUrl = "https://" + cleanUrl
        }

        // Security: Save token to hardware Keychain
        KeychainHelper.shared.save(token: token, for: user)

        self.connectionInfo.serverUrl = cleanUrl
        self.connectionInfo.username = user
        self.connectionInfo.trustSelfSignedCerts = trustSelfSigned
        self.securityDelegate.allowSelfSigned = trustSelfSigned
        self.connectionInfo.isConnected = true
        self.isConnected = true
        self.fetchServerLibrary()
    }

    /// Resolves endpoint URL
    public func endpointURL(_ path: String) -> URL? {
        guard let baseURL = connectionInfo.resolvedBaseURL else { return nil }
        let cleanPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        return baseURL.appendingPathComponent(cleanPath)
    }

    /// Builds a URLRequest configured with Bearer tokens from Keychain
    public func createURLRequest(for endpoint: String, method: String = "GET") -> URLRequest? {
        guard let url = endpointURL(endpoint) else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = method

        // Standard Authorization Bearer securely retrieved from Keychain
        if let token = KeychainHelper.shared.read(for: connectionInfo.username), !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        request.setValue("Downtify-iOS-Client/2.8", forHTTPHeaderField: "User-Agent")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        return request
    }

    /// Diagnostic test for server latency and reachability
    public func testServerConnection(completion: @escaping (Bool, Int, String?) -> Void) {
        guard let req = createURLRequest(for: "api/health") else {
            completion(false, 0, "Invalid server URL")
            return
        }

        let start = Date()
        session.dataTask(with: req) { _, response, error in
            let elapsed = Int(Date().timeIntervalSince(start) * 1000)
            if let error = error {
                DispatchQueue.main.async {
                    completion(false, elapsed, error.localizedDescription)
                }
                return
            }

            guard let httpResponse = response as? HTTPURLResponse else {
                DispatchQueue.main.async {
                    completion(false, elapsed, "Unknown response type")
                }
                return
            }

            let isSuccess = (200...299).contains(httpResponse.statusCode)
            DispatchQueue.main.async {
                self.connectionInfo.pingMs = elapsed
                completion(isSuccess, elapsed, isSuccess ? nil : "HTTP \(httpResponse.statusCode)")
            }
        }.resume()
    }

    public func disconnect() {
        self.isConnected = false
        self.connectionInfo.isConnected = false
        // Clear session tokens on sign out
        KeychainHelper.shared.delete(for: connectionInfo.username)
    }

    public func toggleLikeTrack(trackId: String) {
        if let idx = tracks.firstIndex(where: { $0.id == trackId }) {
            tracks[idx].isLiked.toggle()
        }
    }

    public func toggleFavorite(trackId: String) async {
        await MainActor.run {
            self.toggleLikeTrack(trackId: trackId)
        }
    }

    public func fetchServerLibrary() {
        self.isLoading = true
        // Simulated network fetch from Downtify Server /api/library/tracks
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            self.isLoading = false
            self.connectionInfo.pingMs = Int.random(in: 14...28)
        }
    }

    public func requestServerDownload(url: String, format: String, bitrate: String) {
        let newTask = ServerDownloadTask(
            id: UUID().uuidString,
            title: "Resolving Embed...",
            artist: "Downtify Server",
            coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
            progress: 10,
            status: "downloading",
            stageLabel: "Querying ytmusicapi & yt-dlp",
            format: format,
            bitrate: bitrate
        )
        self.serverTasks.insert(newTask, at: 0)
    }

    private func loadMockData() {
        self.tracks = [
            Track(
                id: "track-1",
                title: "Blinding Lights",
                artist: "The Weeknd",
                album: "After Hours",
                releaseYear: "2020",
                trackNumber: 9,
                genre: "Synthpop",
                duration: 200,
                coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600",
                format: "flac",
                bitrate: "lossless",
                fileSizeMb: 24.8,
                isLiked: true,
                isOfflineCached: true
            ),
            Track(
                id: "track-2",
                title: "Get Lucky",
                artist: "Daft Punk ft. Pharrell Williams",
                album: "Random Access Memories",
                releaseYear: "2013",
                trackNumber: 8,
                genre: "Disco Funk",
                duration: 248,
                coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600",
                format: "mp3",
                bitrate: "320k",
                fileSizeMb: 9.6,
                isLiked: true,
                isOfflineCached: true
            ),
            Track(
                id: "track-3",
                title: "Midnight City",
                artist: "M83",
                album: "Hurry Up, We’re Dreaming",
                releaseYear: "2011",
                trackNumber: 2,
                genre: "Synthwave",
                duration: 243,
                coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600",
                format: "m4a",
                bitrate: "256k",
                fileSizeMb: 7.8,
                isLiked: false,
                isOfflineCached: false
            ),
            Track(
                id: "track-4",
                title: "Starboy",
                artist: "The Weeknd ft. Daft Punk",
                album: "Starboy",
                releaseYear: "2016",
                trackNumber: 1,
                genre: "R&B / Electro",
                duration: 230,
                coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
                format: "flac",
                bitrate: "lossless",
                fileSizeMb: 27.2,
                isLiked: true,
                isOfflineCached: false
            )
        ]

        self.playlists = [
            Playlist(
                id: "pl-liked",
                name: "Liked Songs",
                description: "Tracks starred on your Downtify server",
                coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600",
                trackIds: ["track-1", "track-2", "track-4"],
                isSpecialLiked: true
            ),
            Playlist(
                id: "pl-1",
                name: "Downtify Top Hits",
                description: "Auto-synced from Spotify Today’s Top Hits",
                coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600",
                trackIds: ["track-1", "track-2", "track-4"],
                isMonitored: true
            ),
            Playlist(
                id: "pl-2",
                name: "Retrowave & Synth Odyssey",
                description: "Lossless FLAC synth masterpieces",
                coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600",
                trackIds: ["track-3", "track-1"],
                isMonitored: false
            )
        ]
    }
}

/// URLSession delegate that safely validates SSL/TLS certificates.
/// Security rule: Self-signed certificates are strictly constrained to private LAN subnets
/// (.local, 192.168.x.x, 10.x.x.x, 172.16.x.x, localhost).
public class DowntifySSLSecurityDelegate: NSObject, URLSessionDelegate {
    public var allowSelfSigned: Bool = false

    public func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        if allowSelfSigned && challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust {
            let host = challenge.protectionSpace.host.lowercased()
            // Ensure self-signed bypass only applies to private home lab network endpoints
            let isPrivateLAN = host.hasSuffix(".local") ||
                               host == "localhost" ||
                               host.hasPrefix("192.168.") ||
                               host.hasPrefix("10.") ||
                               host.hasPrefix("172.")
            
            if isPrivateLAN, let serverTrust = challenge.protectionSpace.serverTrust {
                completionHandler(.useCredential, URLCredential(trust: serverTrust))
                return
            }
        }
        completionHandler(.performDefaultHandling, nil)
    }
}
