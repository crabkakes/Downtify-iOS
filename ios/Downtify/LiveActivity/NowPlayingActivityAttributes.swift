//
//  NowPlayingActivityAttributes.swift
//  Downtify iOS - Dynamic Island & Live Activities (iOS 17 & iOS 18)
//

import Foundation
import ActivityKit
import SwiftUI

/// ActivityAttributes for iOS 18 Dynamic Island and Lock Screen Live Activity
public struct DowntifyNowPlayingActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var title: String
        public var artist: String
        public var album: String
        public var isPlaying: Bool
        public var playbackPosition: Double
        public var duration: Double
        public var isLossless: Bool
        public var downloadProgress: Double?

        public init(
            title: String,
            artist: String,
            album: String,
            isPlaying: Bool,
            playbackPosition: Double,
            duration: Double,
            isLossless: Bool = true,
            downloadProgress: Double? = nil
        ) {
            self.title = title
            self.artist = artist
            self.album = album
            self.isPlaying = isPlaying
            self.playbackPosition = playbackPosition
            self.duration = duration
            self.isLossless = isLossless
            self.downloadProgress = downloadProgress
        }
    }

    public var serverName: String

    public init(serverName: String = "Downtify Server") {
        self.serverName = serverName
    }
}
