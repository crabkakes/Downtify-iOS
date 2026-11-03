//
//  ServerModels.swift
//  Downtify iOS
//

import Foundation

public struct ServerConnectionInfo: Codable {
    public var serverUrl: String
    public var username: String
    public var serverVersion: String
    public var pingMs: Int
    public var isConnected: Bool
    public var totalTracks: Int
    public var totalPlaylists: Int
    public var totalStorageGb: Double
    public var trustSelfSignedCerts: Bool

    public init(
        serverUrl: String = "https://downtify.local:8000",
        username: String = "alex",
        serverVersion: String = "v2.8.4",
        pingMs: Int = 18,
        isConnected: Bool = true,
        totalTracks: Int = 142,
        totalPlaylists: Int = 8,
        totalStorageGb: Double = 1.4,
        trustSelfSignedCerts: Bool = false
    ) {
        self.serverUrl = serverUrl
        self.username = username
        self.serverVersion = serverVersion
        self.pingMs = pingMs
        self.isConnected = isConnected
        self.totalTracks = totalTracks
        self.totalPlaylists = totalPlaylists
        self.totalStorageGb = totalStorageGb
        self.trustSelfSignedCerts = trustSelfSignedCerts
    }

    /// Retrieves secure token from Keychain
    public var token: String? {
        KeychainHelper.shared.read(for: username)
    }

    /// Safely resolves the server URL, enforcing safe http/https schemes
    public var resolvedBaseURL: URL? {
        var base = serverUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        if !base.lowercased().hasPrefix("http://") && !base.lowercased().hasPrefix("https://") {
            base = "https://" + base
        }
        if base.hasSuffix("/") {
            base = String(base.dropLast())
        }
        guard let url = URL(string: base),
              let scheme = url.scheme?.lowercased(),
              ["http", "https"].contains(scheme) else {
            return nil
        }
        return url
    }
}

public struct QRAuthPayload: Codable {
    public let server: String
    public let user: String
    public let token: String
    public let port: Int?
}

public struct ServerDownloadRequest: Codable {
    public let url: String
    public let format: String
    public let bitrate: String
    public let addToPlaylistId: String?
}

public struct ServerDownloadTask: Identifiable, Codable {
    public let id: String
    public let title: String
    public let artist: String
    public let coverUrl: String
    public var progress: Int
    public var status: String
    public var stageLabel: String
    public let format: String
    public let bitrate: String
}
