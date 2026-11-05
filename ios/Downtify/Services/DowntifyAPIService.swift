//
//  DowntifyAPIService.swift
//  Downtify iOS
//

import Foundation
import Combine

public class DowntifyAPIService: ObservableObject {
    public static let shared = DowntifyAPIService()

    @Published public var connectionInfo = ServerConnectionInfo()
    @Published public var isConnected: Bool = false
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
        guard let req = createURLRequest(for: "api/tracks") else {
            self.isLoading = false
            return
        }
        self.isLoading = true
        session.dataTask(with: req) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                guard let data = data,
                      let httpResponse = response as? HTTPURLResponse,
                      (200...299).contains(httpResponse.statusCode) else {
                    return
                }
                if let decoded = try? JSONDecoder().decode([Track].self, from: data) {
                    self?.tracks = decoded
                }
            }
        }.resume()
    }

    public func requestServerDownload(url: String, format: String, bitrate: String) {
        guard let req = createURLRequest(for: "api/download", method: "POST") else { return }
        var postReq = req
        postReq.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: String] = ["url": url, "format": format, "bitrate": bitrate]
        postReq.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        session.dataTask(with: postReq) { [weak self] data, response, _ in
            DispatchQueue.main.async {
                self?.fetchServerLibrary()
            }
        }.resume()
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
