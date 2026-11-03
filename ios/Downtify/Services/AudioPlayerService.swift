//
//  AudioPlayerService.swift
//  Downtify iOS - Native Audio Engine (iOS 18 & Swift 6 Compatible)
//

import Foundation
import AVFoundation
import MediaPlayer
import Combine

@MainActor
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
    @Published public var isOfflineTrack: Bool = false
    @Published public var streamingQuality: StreamingQuality = .original

    public enum RepeatMode {
        case off, all, one
    }

    public enum StreamingQuality: String, CaseIterable, Identifiable {
        case original = "Lossless (FLAC/Source)"
        case high320 = "High (320 kbps MP3)"
        case medium128 = "Data Saver (128 kbps AAC)"

        public var id: String { self.rawValue }

        public var queryParam: String {
            switch self {
            case .original: return "quality=original"
            case .high320: return "quality=320k"
            case .medium128: return "quality=128k"
            }
        }
    }

    private var player: AVPlayer?
    private var timeObserverToken: Any?
    private var cancellables = Set<AnyCancellable>()

    override init() {
        super.init()
        setupAudioSessionObservers()
        setupRemoteCommands()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        if let token = timeObserverToken {
            player?.removeTimeObserver(token)
        }
    }

    // MARK: - Playback Controls

    public func playTrack(_ track: Track) {
        self.currentTrack = track
        self.duration = track.duration
        self.currentTime = 0.0
        self.isPlaying = true
        self.isOfflineTrack = DownloadManager.shared.isDownloaded(trackId: track.id)

        // Ensure track is in queue
        if !queue.contains(where: { $0.id == track.id }) {
            queue.insert(track, at: 0)
        }

        // If local offline file exists, play from Documents/OfflineMusic; otherwise stream from server
        if let localURL = DownloadManager.shared.localFileURL(for: track.id) {
            let playerItem = AVPlayerItem(url: localURL)
            self.player = AVPlayer(playerItem: playerItem)
            self.isOfflineTrack = true
        } else {
            // Stream over HTTP/HTTPS from Downtify Server
            let endpoint = "api/stream/\(track.id)?\(streamingQuality.queryParam)"
            if let streamURL = DowntifyAPIService.shared.endpointURL(endpoint) {
                var headers: [String: String] = [:]
                if let token = KeychainHelper.shared.read(for: DowntifyAPIService.shared.connectionInfo.username), !token.isEmpty {
                    headers["Authorization"] = "Bearer \(token)"
                }
                headers["User-Agent"] = "Downtify-iOS-AVPlayer/2.8"

                let asset = AVURLAsset(url: streamURL, options: ["AVURLAssetHTTPHeaderFieldsKey": headers])
                let playerItem = AVPlayerItem(asset: asset)
                self.player = AVPlayer(playerItem: playerItem)
                self.isOfflineTrack = false
            }
        }

        player?.play()
        updateNowPlayingInfo()
    }

    public func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            play()
        }
    }

    public func play() {
        self.isPlaying = true
        player?.play()
        updateNowPlayingInfo()
    }

    public func pause() {
        self.isPlaying = false
        player?.pause()
        updateNowPlayingInfo()
    }

    public func seek(to time: Double) {
        self.currentTime = time
        let targetTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: targetTime)
        updateNowPlayingInfo()
    }

    public func nextTrack() {
        guard !queue.isEmpty else { return }
        guard let current = currentTrack, let idx = queue.firstIndex(where: { $0.id == current.id }) else {
            if let first = queue.first { playTrack(first) }
            return
        }
        let nextIdx = (idx + 1) % queue.count
        playTrack(queue[nextIdx])
    }

    public func prevTrack() {
        guard !queue.isEmpty else { return }
        guard let current = currentTrack, let idx = queue.firstIndex(where: { $0.id == current.id }) else {
            if let last = queue.last { playTrack(last) }
            return
        }
        let prevIdx = (idx - 1 + queue.count) % queue.count
        playTrack(queue[prevIdx])
    }

    // MARK: - Queue Management (Android Companion Alignment)

    public func addToQueue(_ track: Track) {
        queue.append(track)
    }

    public func playNext(_ track: Track) {
        guard let current = currentTrack, let currentIdx = queue.firstIndex(where: { $0.id == current.id }) else {
            queue.insert(track, at: 0)
            return
        }
        queue.insert(track, at: currentIdx + 1)
    }

    public func removeFromQueue(at index: Int) {
        guard index >= 0 && index < queue.count else { return }
        queue.remove(at: index)
    }

    public func clearQueue() {
        if let current = currentTrack {
            queue = [current]
        } else {
            queue.removeAll()
        }
    }

    // MARK: - Modern iOS Audio Session Interruption & Route Change Observers

    private func setupAudioSessionObservers() {
        let center = NotificationCenter.default

        // Handle Audio Interruptions (e.g., incoming phone call, FaceTime, Siri)
        center.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] notification in
            guard let self = self,
                  let userInfo = notification.userInfo,
                  let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }

            switch type {
            case .began:
                self.pause()
            case .ended:
                if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
                    let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                    if options.contains(.shouldResume) {
                        self.play()
                    }
                }
            @unknown default:
                break
            }
        }

        // Handle Route Changes (e.g. AirPods battery dies, headphones unplugged -> pause immediately)
        center.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] notification in
            guard let self = self,
                  let userInfo = notification.userInfo,
                  let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
                  let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else { return }

            switch reason {
            case .oldDeviceUnavailable:
                self.pause()
            case .newDeviceAvailable:
                print("Downtify: New audio output device detected.")
            default:
                break
            }
        }
    }

    // MARK: - MPRemoteCommandCenter (CarPlay, Apple Watch & Lock Screen)

    private func setupRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.play()
            return .success
        }

        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.pause()
            return .success
        }

        commandCenter.togglePlayPauseCommand.isEnabled = true
        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.togglePlayPause()
            return .success
        }

        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            self?.nextTrack()
            return .success
        }

        commandCenter.previousTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            self?.prevTrack()
            return .success
        }

        commandCenter.changePlaybackPositionCommand.isEnabled = true
        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let self = self, let positionEvent = event as? MPChangePlaybackPositionCommandEvent else {
                return .commandFailed
            }
            self.seek(to: positionEvent.positionTime)
            return .success
        }

        commandCenter.skipForwardCommand.preferredIntervals = [15]
        commandCenter.skipForwardCommand.isEnabled = true
        commandCenter.skipForwardCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.seek(to: min(self.currentTime + 15, self.duration))
            return .success
        }

        commandCenter.skipBackwardCommand.preferredIntervals = [15]
        commandCenter.skipBackwardCommand.isEnabled = true
        commandCenter.skipBackwardCommand.addTarget { [weak self] _ in
            guard let self = self else { return .commandFailed }
            self.seek(to: max(self.currentTime - 15, 0))
            return .success
        }

        commandCenter.likeCommand.isEnabled = true
        commandCenter.likeCommand.localizedTitle = "Favorite on Downtify"
        commandCenter.likeCommand.addTarget { [weak self] _ in
            guard let self = self, let track = self.currentTrack else { return .commandFailed }
            Task {
                await DowntifyAPIService.shared.toggleFavorite(trackId: track.id)
            }
            return .success
        }
    }

    // MARK: - Now Playing Info

    public func updateNowPlayingInfo() {
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
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1.0 : 0.0,
            MPNowPlayingInfoPropertyDefaultPlaybackRate: 1.0
        ]

        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
}
