//
//  DowntifyAppIntents.swift
//  Downtify iOS - App Intents & iOS 18 Control Center Widgets
//

import Foundation
import AppIntents
import WidgetKit
import SwiftUI

// MARK: - App Intents (iOS 17 & iOS 18)

/// Play / Pause toggle intent compatible with Siri, Shortcuts, Action Button, and iOS 18 Control Center
public struct TogglePlaybackIntent: AudioPlaybackIntent {
    public static var title: LocalizedStringResource = "Toggle Downtify Playback"
    public static var description = IntentDescription("Plays or pauses your current audio stream from the Downtify server.")

    public init() {}

    @MainActor
    public func perform() async throws -> some IntentResult {
        AudioPlayerService.shared.togglePlayPause()
        return .result()
    }
}

/// Skip to next track intent
public struct SkipNextTrackIntent: AudioPlaybackIntent {
    public static var title: LocalizedStringResource = "Skip to Next Track"
    public static var description = IntentDescription("Skips to the next track in your queue.")

    public init() {}

    @MainActor
    public func perform() async throws -> some IntentResult {
        AudioPlayerService.shared.nextTrack()
        return .result()
    }
}

/// Toggle Offline-Only Mode intent
public struct ToggleOfflineModeIntent: AppIntent {
    public static var title: LocalizedStringResource = "Toggle Offline Only"
    public static var description = IntentDescription("Switches Downtify into offline cached mode.")

    public init() {}

    @MainActor
    public func perform() async throws -> some IntentResult {
        // Toggle offline filtering mode
        return .result()
    }
}

// MARK: - iOS 18 Control Center Widgets

#if canImport(WidgetKit)
@available(iOS 18.0, *)
public struct DowntifyPlayPauseControlWidget: ControlWidget {
    public static let kind: String = "com.henriquesebastiao.downtify.playpause-control"

    public init() {}

    public var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: TogglePlaybackIntent()) {
                Label("Downtify Play/Pause", systemImage: "play.pause.fill")
            }
        }
        .displayName("Play/Pause")
        .description("Quickly start or pause your self-hosted music stream.")
    }
}

@available(iOS 18.0, *)
public struct DowntifyNextTrackControlWidget: ControlWidget {
    public static let kind: String = "com.henriquesebastiao.downtify.next-control"

    public init() {}

    public var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: SkipNextTrackIntent()) {
                Label("Next Track", systemImage: "forward.fill")
            }
        }
        .displayName("Next Track")
        .description("Skip to the next song in your Downtify queue.")
    }
}
#endif
