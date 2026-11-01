//
//  AudioPlayerEngine.swift
//  Downtify iOS
//
//  Created by Henrique Sebastião & Downtify Contributors.
//  Copyright © 2026 Downtify. All rights reserved.
//

import Foundation
import AVFoundation
import MediaPlayer

public class AudioPlayerEngine: NSObject {
    public static let shared = AudioPlayerEngine()
    
    private var player: AVPlayer?
    private var isPlaying = false
    private var currentTrackId: String?
    
    override init() {
        super.init()
        setupAudioSession()
        setupRemoteCommands()
    }
    
    // MARK: - AVAudioSession Setup
    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetooth, .allowBluetoothA2DP])
            try session.setActive(true)
        } catch {
            print("Failed to configure AVAudioSession: \(error.localizedDescription)")
        }
    }
    
    // MARK: - MPRemoteCommandCenter (Lock Screen / Headphones / Dynamic Island)
    private func setupRemoteCommands() {
        let commandCenter = MPRemoteCommandCenter.shared()
        
        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.resume()
            NotificationCenter.default.post(name: Notification.Name("DowntifyRemotePlay"), object: nil)
            return .success
        }
        
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.pause()
            NotificationCenter.default.post(name: Notification.Name("DowntifyRemotePause"), object: nil)
            return .success
        }
        
        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.nextTrackCommand.addTarget { _ in
            NotificationCenter.default.post(name: Notification.Name("DowntifyRemoteNext"), object: nil)
            return .success
        }
        
        commandCenter.previousTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.addTarget { _ in
            NotificationCenter.default.post(name: Notification.Name("DowntifyRemotePrev"), object: nil)
            return .success
        }
        
        commandCenter.changePlaybackPositionCommand.isEnabled = true
        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let positionEvent = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            self?.seek(to: positionEvent.positionTime)
            return .success
        }
    }
    
    // MARK: - Playback Control
    public func play(url: URL, title: String, artist: String, album: String, artworkUrl: String?, duration: Double) {
        let playerItem = AVPlayerItem(url: url)
        if player == nil {
            player = AVPlayer(playerItem: playerItem)
        } else {
            player?.replaceCurrentItem(with: playerItem)
        }
        
        player?.play()
        isPlaying = true
        
        updateNowPlayingInfo(
            title: title,
            artist: artist,
            album: album,
            artworkUrl: artworkUrl,
            duration: duration,
            currentTime: 0.0
        )
    }
    
    public func pause() {
        player?.pause()
        isPlaying = false
        updatePlaybackRate(rate: 0.0)
    }
    
    public func resume() {
        player?.play()
        isPlaying = true
        updatePlaybackRate(rate: 1.0)
    }
    
    public func seek(to seconds: Double) {
        let time = CMTime(seconds: seconds, preferredTimescale: 600)
        player?.seek(to: time)
    }
    
    // MARK: - MPNowPlayingInfoCenter
    public func updateNowPlayingInfo(title: String, artist: String, album: String, artworkUrl: String?, duration: Double, currentTime: Double) {
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPMediaItemPropertyAlbumTitle: album,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1.0 : 0.0
        ]
        
        if let artworkUrlString = artworkUrl, let url = URL(string: artworkUrlString) {
            DispatchQueue.global().async {
                if let data = try? Data(contentsOf: url), let image = UIImage(data: data) {
                    let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                    DispatchQueue.main.async {
                        var current = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
                        current[MPMediaItemPropertyArtwork] = artwork
                        MPNowPlayingInfoCenter.default().nowPlayingInfo = current
                    }
                }
            }
        }
        
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
    
    private func updatePlaybackRate(rate: Float) {
        if var info = MPNowPlayingInfoCenter.default().nowPlayingInfo {
            info[MPNowPlayingInfoPropertyPlaybackRate] = rate
            if let current = player?.currentTime().seconds {
                info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = current
            }
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        }
    }
}
