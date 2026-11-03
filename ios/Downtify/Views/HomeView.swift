//
//  HomeView.swift
//  Downtify iOS - Companion Dashboard
//  Ported from henriquesebastiao/downtify-android
//

import SwiftUI

struct HomeView: View {
    @EnvironmentObject var apiService: DowntifyAPIService
    @EnvironmentObject var audioPlayer: AudioPlayerService
    @EnvironmentObject var downloadManager: DownloadManager

    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Server Status Header Card
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack(spacing: 6) {
                                    Circle()
                                        .fill(apiService.isConnected ? Color.emeraldGreen : Color.red)
                                        .frame(width: 8, height: 8)
                                    Text(apiService.isConnected ? "CONNECTED TO SERVER" : "OFFLINE")
                                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                                        .foregroundColor(apiService.isConnected ? .emeraldGreen : .red)
                                }
                                Text(apiService.connectionInfo.serverUrl)
                                    .font(.caption2)
                                    .foregroundColor(.gray)
                                    .lineLimit(1)
                            }

                            Spacer()

                            HStack(spacing: 4) {
                                Image(systemName: "bolt.fill")
                                    .font(.system(size: 10))
                                    .foregroundColor(.emeraldGreen)
                                Text("\(apiService.connectionInfo.pingMs) ms")
                                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                    .foregroundColor(.white)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(white: 0.15))
                            .cornerRadius(8)
                        }
                        .padding()
                        .background(Color(white: 0.10))
                        .cornerRadius(16)
                        .padding(.horizontal)

                        // Liked Songs Hero Banner
                        if let likedPl = apiService.playlists.first(where: { $0.isSpecialLiked }) {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 14) {
                                    ZStack {
                                        LinearGradient(
                                            colors: [Color.purple.opacity(0.8), Color.emeraldGreen.opacity(0.8)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                        Image(systemName: "heart.fill")
                                            .font(.title2)
                                            .foregroundColor(.white)
                                    }
                                    .frame(width: 56, height: 56)
                                    .cornerRadius(12)

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(likedPl.name)
                                            .font(.headline)
                                            .fontWeight(.bold)
                                            .foregroundColor(.white)
                                        Text("\(likedPl.trackIds.count) tracks starred on server")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }

                                    Spacer()

                                    Button {
                                        if let firstId = likedPl.trackIds.first,
                                           let firstTrack = apiService.tracks.first(where: { $0.id == firstId }) {
                                            audioPlayer.queue = apiService.tracks.filter { likedPl.trackIds.contains($0.id) }
                                            audioPlayer.playTrack(firstTrack)
                                        }
                                    } label: {
                                        Image(systemName: "play.circle.fill")
                                            .font(.system(size: 44))
                                            .foregroundColor(.emeraldGreen)
                                    }
                                }
                            }
                            .padding()
                            .background(Color(white: 0.12))
                            .cornerRadius(18)
                            .padding(.horizontal)
                        }

                        // Quick 6-Grid Mixes
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recent & Favorite Tracks")
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal)

                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                                ForEach(apiService.tracks) { track in
                                    Button {
                                        audioPlayer.playTrack(track)
                                    } label: {
                                        HStack(spacing: 10) {
                                            AsyncImage(url: URL(string: track.coverUrl)) { img in
                                                img.resizable().scaledToFill()
                                            } placeholder: {
                                                Color.gray.opacity(0.3)
                                            }
                                            .frame(width: 48, height: 48)
                                            .clipped()

                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(track.title)
                                                    .font(.caption)
                                                    .fontWeight(.semibold)
                                                    .foregroundColor(.white)
                                                    .lineLimit(1)
                                                Text(track.artist)
                                                    .font(.caption2)
                                                    .foregroundColor(.gray)
                                                    .lineLimit(1)
                                            }
                                            Spacer()
                                        }
                                        .background(Color(white: 0.14))
                                        .cornerRadius(8)
                                        .clipped()
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }

                        // Server Downloads In Progress (Android feature)
                        if !apiService.serverTasks.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("Server Downloads")
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal)

                                ForEach(apiService.serverTasks) { task in
                                    HStack(spacing: 12) {
                                        AsyncImage(url: URL(string: task.coverUrl)) { img in
                                            img.resizable().scaledToFill()
                                        } placeholder: {
                                            Color.gray.opacity(0.3)
                                        }
                                        .frame(width: 40, height: 40)
                                        .cornerRadius(6)

                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(task.title)
                                                .font(.caption)
                                                .fontWeight(.semibold)
                                                .foregroundColor(.white)
                                            Text(task.stageLabel)
                                                .font(.caption2)
                                                .foregroundColor(.emeraldGreen)
                                        }

                                        Spacer()

                                        ProgressView(value: Double(task.progress), total: 100)
                                            .progressViewStyle(LinearProgressViewStyle(tint: .emeraldGreen))
                                            .frame(width: 60)
                                    }
                                    .padding(12)
                                    .background(Color(white: 0.10))
                                    .cornerRadius(12)
                                    .padding(.horizontal)
                                }
                            }
                        }
                    }
                    .padding(.vertical)
                    .padding(.bottom, 60)
                }
            }
            .navigationTitle("Downtify")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}
