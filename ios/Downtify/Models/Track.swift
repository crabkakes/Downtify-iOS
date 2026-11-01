//
//  Track.swift
//  Downtify iOS
//

import Foundation

public struct Track: Identifiable, Codable, Hashable {
    public let id: String
    public var title: String
    public var artist: String
    public var album: String
    public var releaseYear: String
    public var trackNumber: Int
    public var genre: String
    public var duration: Double // seconds
    public var coverUrl: String
    public var streamUrl: String
    public var format: String
    public var bitrate: String
    public var fileSizeMb: Double
    public var lyrics: [LyricLine]
    public var isLiked: Bool
    public var isOfflineCached: Bool
    public var localFilePath: String?

    public init(
        id: String,
        title: String,
        artist: String,
        album: String,
        releaseYear: String = "2024",
        trackNumber: Int = 1,
        genre: String = "Pop",
        duration: Double,
        coverUrl: String,
        streamUrl: String = "",
        format: String = "flac",
        bitrate: String = "lossless",
        fileSizeMb: Double = 8.5,
        lyrics: [LyricLine] = [],
        isLiked: Bool = false,
        isOfflineCached: Bool = false,
        localFilePath: String? = nil
    ) {
        self.id = id
        self.title = title
        self.artist = artist
        self.album = album
        self.releaseYear = releaseYear
        self.trackNumber = trackNumber
        self.genre = genre
        self.duration = duration
        self.coverUrl = coverUrl
        self.streamUrl = streamUrl
        self.format = format
        self.bitrate = bitrate
        self.fileSizeMb = fileSizeMb
        self.lyrics = lyrics
        self.isLiked = isLiked
        self.isOfflineCached = isOfflineCached
        self.localFilePath = localFilePath
    }
}

public struct LyricLine: Identifiable, Codable, Hashable {
    public var id: Double { time }
    public let time: Double // in seconds
    public let text: String

    public init(time: Double, text: String) {
        self.time = time
        self.text = text
    }
}

public struct Playlist: Identifiable, Codable, Hashable {
    public let id: String
    public var name: String
    public var description: String
    public var coverUrl: String
    public var trackIds: [String]
    public var isMonitored: Bool
    public var lastSynced: String
    public var isSpecialLiked: Bool

    public init(
        id: String,
        name: String,
        description: String = "",
        coverUrl: String = "",
        trackIds: [String] = [],
        isMonitored: Bool = false,
        lastSynced: String = "Just now",
        isSpecialLiked: Bool = false
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.coverUrl = coverUrl
        self.trackIds = trackIds
        self.isMonitored = isMonitored
        self.lastSynced = lastSynced
        self.isSpecialLiked = isSpecialLiked
    }
}
