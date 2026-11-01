//
//  AudioPlayerService.swift
//  Downtify iOS
//

import Foundation
import AVFoundation
import MediaPlayer
import Combine

public class AudioPlayerService: NSObject, ObservableObject {
    public static let shared = AudioPlayerService()

    @Published public var currentTrack: Track?
    @Published public var isPlaying: Bool = false
    @Published public var currentTime: Double = 0.0
    @Published public var duration: Double = 180.0
    @Published public var volume: Float = 0.85
    @Published public var queue: [Track] = []
    @Published public var isShuffle: Bool = false
    @Published public var repeatMode: RepeatMode = .off

    public enum RepeatMode {
        case off, all, one
    }

    private var player: AVPlayer?
    private var timeObserver: Any?

    override init() {
        super.init()
        setupRemoteCommands()
    }

    public func playTrack(_ track: Track) {
        self.currentTrack = track
        self.duration = track.duration
        self.currentTime = 0.0
        self.isPlaying = true

        updateNowPlayingInfo()
    }

    public func togglePlayPause() {
        self.isPlaying.toggle()
        updateNowPlayingInfo()
    }

    public func seek(to time: Double) {
        self.currentTime = time
        updateNowPlayingInfo()
    }

    public func nextTrack() {
        guard let current = currentTrack, let idx = queue.firstIndex(where: { $0.id == current.id }) else {
            return
        }
        let nextIdx = (idx + 1) % queue.count
        playTrack(queue[nextIdx])
    }

    public func prevTrack() {
        guard let current = currentTrack, let idx = queue.firstIndex(where: { $0.id == current.id }) else {
            return
        }
        let prevIdx = (idx - 1 + queue.count) % queue.count
        playTrack(queue[prevIdx])
    }

    private func setupRemoteCommands() {
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.addTarget { [weak self] _ in
            self?.isPlaying = true
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            self?.isPlaying = false
            return .success
        }
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.nextTrack()
            return .success
        }
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.prevTrack()
            return .success
        }
    }

    private func updateNowPlayingInfo() {
        guard let track = currentTrack else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            return
        }

        var info: [String: Any] = [
            MPMediaItemPropertyTitle: track.title,
            MPMediaItemPropertyArtist: track.artist,
            MPMediaItemPropertyAlbumTitle: track.album,
            MPMediaItemPropertyPlaybackDuration: track.duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1.0 : 0.0
        ]
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
}
