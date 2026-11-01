//
//  ServerModels.swift
//  Downtify iOS
//

import Foundation

public struct ServerConnectionInfo: Codable {
    public var serverUrl: String
    public var username: String
    public var token: String?
    public var serverVersion: String
    public var pingMs: Int
    public var isConnected: Bool
    public var totalTracks: Int
    public var totalPlaylists: Int
    public var totalStorageGb: Double
    public var subpath: String
    public var customHeaders: [String: String]
    public var trustSelfSignedCerts: Bool

    public init(
        serverUrl: String = "https://downtify.local:8000",
        username: String = "alex",
        token: String? = "dt_auth_token_98234",
        serverVersion: String = "v2.8.4",
        pingMs: Int = 18,
        isConnected: Bool = true,
        totalTracks: Int = 142,
        totalPlaylists: Int = 8,
        totalStorageGb: Double = 1.4,
        subpath: String = "",
        customHeaders: [String: String] = [:],
        trustSelfSignedCerts: Bool = false
    ) {
        self.serverUrl = serverUrl
        self.username = username
        self.token = token
        self.serverVersion = serverVersion
        self.pingMs = pingMs
        self.isConnected = isConnected
        self.totalTracks = totalTracks
        self.totalPlaylists = totalPlaylists
        self.totalStorageGb = totalStorageGb
        self.subpath = subpath
        self.customHeaders = customHeaders
        self.trustSelfSignedCerts = trustSelfSignedCerts
    }

    /// Safely resolves the server URL combined with any reverse proxy subpath prefix (e.g., /downtify)
    public var resolvedBaseURL: URL? {
        var base = serverUrl.trimmingCharacters(in: .whitespacesAndNewlines)
        if base.hasSuffix("/") {
            base = String(base.dropLast())
        }
        let cleanSubpath = subpath.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanSubpath.isEmpty {
            let prefix = cleanSubpath.hasPrefix("/") ? cleanSubpath : "/\(cleanSubpath)"
            let normalized = prefix.hasSuffix("/") ? String(prefix.dropLast()) : prefix
            base += normalized
        }
        return URL(string: base)
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
