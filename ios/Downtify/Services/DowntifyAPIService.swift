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

    private init() {
        loadMockData()
    }

    public func pairWithQRCode(_ jsonString: String) {
        guard let data = jsonString.data(using: .utf8),
              let payload = try? JSONDecoder().decode(QRAuthPayload.self, from: data) else {
            self.errorMessage = "Invalid Downtify QR Code"
            return
        }

        self.connectionInfo.serverUrl = payload.server
        self.connectionInfo.username = payload.user
        self.connectionInfo.token = payload.token
        self.connectionInfo.isConnected = true
        self.isConnected = true
        self.fetchServerLibrary()
    }

    public func connectManually(url: String, user: String, token: String) {
        self.connectionInfo.serverUrl = url
        self.connectionInfo.username = user
        self.connectionInfo.token = token
        self.connectionInfo.isConnected = true
        self.isConnected = true
        self.fetchServerLibrary()
    }

    public func disconnect() {
        self.isConnected = false
        self.connectionInfo.isConnected = false
    }

    public func toggleLikeTrack(trackId: String) {
        if let idx = tracks.firstIndex(where: { $0.id == trackId }) {
            tracks[idx].isLiked.toggle()
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
        // Preload default tracks matching Downtify library
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
