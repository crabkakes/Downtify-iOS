//
//  SettingsView.swift
//  Downtify iOS
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var apiService: DowntifyAPIService
    @EnvironmentObject var audioPlayer: AudioPlayerService
    @EnvironmentObject var downloadManager: DownloadManager

    @State private var showingClearCacheAlert = false
    @State private var showingDisconnectAlert = false

    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Server Connection Card
                        VStack(alignment: .leading, spacing: 14) {
                            HStack {
                                Label("SERVER CONNECTION", systemImage: "server.rack")
                                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                                    .foregroundColor(.emeraldGreen)
                                Spacer()
                                HStack(spacing: 4) {
                                    Circle()
                                        .fill(Color.emeraldGreen)
                                        .frame(width: 8, height: 8)
                                    Text("\(apiService.connectionInfo.pingMs) ms")
                                        .font(.caption2)
                                        .foregroundColor(.white)
                                }
                            }

                            VStack(spacing: 8) {
                                SettingRow(title: "Server URL", value: apiService.connectionInfo.serverUrl)
                                SettingRow(title: "Account", value: apiService.connectionInfo.username)
                                SettingRow(title: "Server Version", value: apiService.connectionInfo.serverVersion)
                                SettingRow(title: "Total Server Library", value: "\(apiService.connectionInfo.totalTracks) tracks (\(String(format: "%.1f", apiService.connectionInfo.totalStorageGb)) GB)")
                            }

                            Button {
                                showingDisconnectAlert = true
                            } label: {
                                Text("Switch / Disconnect Server")
                                    .font(.footnote)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.red)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 44)
                                    .background(Color.red.opacity(0.12))
                                    .cornerRadius(10)
                            }
                        }
                        .padding()
                        .background(Color(white: 0.10))
                        .cornerRadius(16)
                        .padding(.horizontal)

                        // Streaming Audio Quality (Downtify Android signature feature)
                        VStack(alignment: .leading, spacing: 12) {
                            Label("STREAMING AUDIO QUALITY", systemImage: "waveform.path")
                                .font(.system(size: 11, weight: .bold, design: .monospaced))
                                .foregroundColor(.emeraldGreen)

                            Picker("Streaming Quality", selection: $audioPlayer.streamingQuality) {
                                ForEach(AudioPlayerService.StreamingQuality.allCases) { quality in
                                    Text(quality.rawValue).tag(quality)
                                }
                            }
                            .pickerStyle(.segmented)

                            Text(qualityDescription)
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                        .padding()
                        .background(Color(white: 0.10))
                        .cornerRadius(16)
                        .padding(.horizontal)

                        // Offline Music Cache Manager
                        VStack(alignment: .leading, spacing: 14) {
                            Label("OFFLINE STORAGE & CACHE", systemImage: "internaldrive")
                                .font(.system(size: 11, weight: .bold, design: .monospaced))
                                .foregroundColor(.emeraldGreen)

                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("\(String(format: "%.1f", downloadManager.totalCachedSizeMb)) MB")
                                        .font(.title2)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                    Text("\(downloadManager.downloadedTrackIds.count) tracks cached in iOS sandbox")
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                            }

                            Button {
                                showingClearCacheAlert = true
                            } label: {
                                Text("Clear Offline Music Cache")
                                    .font(.footnote)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 44)
                                    .background(Color(white: 0.18))
                                    .cornerRadius(10)
                            }
                        }
                        .padding()
                        .background(Color(white: 0.10))
                        .cornerRadius(16)
                        .padding(.horizontal)

                        // iOS Security & Keychain
                        VStack(alignment: .leading, spacing: 10) {
                            Label("SECURITY & INTEGRATION", systemImage: "lock.shield.fill")
                                .font(.system(size: 11, weight: .bold, design: .monospaced))
                                .foregroundColor(.emeraldGreen)

                            SecurityCheckItem(
                                title: "iOS Keychain Credential Storage",
                                subtitle: "Tokens encrypted with kSecClassGenericPassword"
                            )
                            SecurityCheckItem(
                                title: "App Transport Security (ATS)",
                                subtitle: "NSAllowsLocalNetworking enabled for home lab LAN"
                            )
                            SecurityCheckItem(
                                title: "Apple Privacy Manifest",
                                subtitle: "Zero third-party trackers (PrivacyInfo.xcprivacy)"
                            )
                        }
                        .padding()
                        .background(Color(white: 0.10))
                        .cornerRadius(16)
                        .padding(.horizontal)
                    }
                    .padding(.vertical)
                    .padding(.bottom, 60)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .alert("Disconnect from Server?", isPresented: $showingDisconnectAlert) {
                Button("Disconnect", role: .destructive) {
                    apiService.disconnect()
                }
                Button("Cancel", role: .cancel) {}
            }
            .alert("Clear Offline Cache?", isPresented: $showingClearCacheAlert) {
                Button("Clear All", role: .destructive) {
                    downloadManager.clearAllCache()
                }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    private var qualityDescription: String {
        switch audioPlayer.streamingQuality {
        case .original:
            return "Streams pure uncompressed FLAC or original source bitrate. Ideal for Wi-Fi and high-fidelity headphones."
        case .high320:
            return "Transcoded to 320 kbps MP3 by Downtify server. Great balance between CD-quality sound and bandwidth."
        case .medium128:
            return "Transcoded to 128 kbps AAC. Conserves mobile cellular data and reduces battery consumption."
        }
    }
}

struct SettingRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
            Spacer()
            Text(value)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .lineLimit(1)
        }
    }
}

struct SecurityCheckItem: View {
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.emeraldGreen)
            VStack(alignment: .leading, spacing: 1) {
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            Spacer()
        }
    }
}
