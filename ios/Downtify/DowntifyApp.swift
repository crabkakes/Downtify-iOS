//
//  DowntifyApp.swift
//  Downtify - Native iOS Client
//  Ported from henriquesebastiao/downtify-android to native Swift & SwiftUI
//

import SwiftUI
import AVFoundation

@main
struct DowntifyApp: App {
    @StateObject private var apiService = DowntifyAPIService.shared
    @StateObject private var audioPlayer = AudioPlayerService.shared
    @StateObject private var downloadManager = DownloadManager.shared

    init() {
        setupAudioSession()
    }

    var body: some Scene {
        WindowGroup {
            if apiService.isConnected {
                MainTabView()
                    .environmentObject(apiService)
                    .environmentObject(audioPlayer)
                    .environmentObject(downloadManager)
                    .preferredColorScheme(.dark)
            } else {
                ServerPairingView()
                    .environmentObject(apiService)
                    .preferredColorScheme(.dark)
            }
        }
    }

    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetooth, .allowBluetoothA2DP])
            try session.setActive(true)
        } catch {
            print("Failed to set background audio session: \(error.localizedDescription)")
        }
    }
}
