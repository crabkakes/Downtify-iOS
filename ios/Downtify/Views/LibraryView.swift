//
//  LibraryView.swift
//  Downtify iOS
//

import SwiftUI

struct LibraryView: View {
    @EnvironmentObject var apiService: DowntifyAPIService
    @EnvironmentObject var audioPlayer: AudioPlayerService
    @EnvironmentObject var downloadManager: DownloadManager

    @State private var selectedFilter = 0 // 0: All, 1: Downloaded, 2: Playlists, 3: Liked
    @State private var showingQueueSheet = false

    var displayedTracks: [Track] {
        var base = apiService.tracks
        if downloadManager.isOfflineModeOnly || selectedFilter == 1 {
            base = base.filter { downloadManager.isDownloaded(trackId: $0.id) }
        } else if selectedFilter == 3 {
            base = base.filter { $0.isLiked }
        }
        return base
    }

    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()

                VStack(spacing: 12) {
                    // Offline Mode Bar & Queue Access
                    HStack {
                        Toggle(isOn: $downloadManager.isOfflineModeOnly) {
                            HStack(spacing: 6) {
                                Image(systemName: "arrow.down.circle.fill")
                                    .foregroundColor(.emeraldGreen)
                                Text("Offline Mode Only")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.white)
                            }
                        }
                        .tint(.emeraldGreen)

                        Spacer()

                        Button {
                            showingQueueSheet = true
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "list.bullet")
                                Text("Queue (\(audioPlayer.queue.count))")
                            }
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.emeraldGreen)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.emeraldGreen.opacity(0.15))
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)

                    // Filter Pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            FilterChip(title: "All Songs", isSelected: selectedFilter == 0) { selectedFilter = 0 }
                            FilterChip(title: "Downloaded (\(downloadManager.downloadedTrackIds.count))", isSelected: selectedFilter == 1) { selectedFilter = 1 }
                            FilterChip(title: "Playlists (\(apiService.playlists.count))", isSelected: selectedFilter == 2) { selectedFilter = 2 }
                            FilterChip(title: "Liked Songs", isSelected: selectedFilter == 3) { selectedFilter = 3 }
                        }
                        .padding(.horizontal)
                    }

                    if selectedFilter == 2 {
                        // Playlists Grid / List
                        List {
                            ForEach(apiService.playlists) { pl in
                                HStack(spacing: 14) {
                                    AsyncImage(url: URL(string: pl.coverUrl)) { img in
                                        img.resizable().scaledToFill()
                                    } placeholder: {
                                        Color.gray.opacity(0.3)
                                    }
                                    .frame(width: 52, height: 52)
                                    .cornerRadius(8)

                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(pl.name)
                                            .font(.headline)
                                            .foregroundColor(.white)
                                        Text("\(pl.trackIds.count) tracks • \(pl.description)")
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                            .lineLimit(1)
                                    }
                                }
                                .listRowBackground(Color.clear)
                            }
                        }
                        .listStyle(.plain)
                    } else {
                        // Track List
                        List {
                            ForEach(displayedTracks) { track in
                                HStack(spacing: 12) {
                                    Button {
                                        audioPlayer.playTrack(track)
                                    } label: {
                                        HStack(spacing: 12) {
                                            AsyncImage(url: URL(string: track.coverUrl)) { img in
                                                img.resizable().scaledToFill()
                                            } placeholder: {
                                                Color.gray.opacity(0.3)
                                            }
                                            .frame(width: 44, height: 44)
                                            .cornerRadius(6)

                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(track.title)
                                                    .font(.subheadline)
                                                    .fontWeight(.semibold)
                                                    .foregroundColor(.white)
                                                    .lineLimit(1)
                                                HStack(spacing: 6) {
                                                    Text(track.artist)
                                                        .font(.caption2)
                                                        .foregroundColor(.gray)
                                                        .lineLimit(1)
                                                    Text("•")
                                                        .font(.caption2)
                                                        .foregroundColor(.gray)
                                                    Text(track.format.uppercased())
                                                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                                                        .foregroundColor(.emeraldGreen)
                                                }
                                            }
                                        }
                                    }
                                    .buttonStyle(.plain)

                                    Spacer()

                                    Button {
                                        downloadManager.toggleDownload(for: track)
                                    } label: {
                                        Image(systemName: downloadManager.isDownloaded(trackId: track.id) ? "checkmark.circle.fill" : "arrow.down.circle")
                                            .font(.title3)
                                            .foregroundColor(downloadManager.isDownloaded(trackId: track.id) ? .emeraldGreen : .gray)
                                            .frame(width: 44, height: 44)
                                    }
                                    .buttonStyle(.plain)
                                }
                                .listRowBackground(Color.clear)
                                .swipeActions(edge: .trailing) {
                                    Button(role: downloadManager.isDownloaded(trackId: track.id) ? .destructive : .none) {
                                        downloadManager.toggleDownload(for: track)
                                    } label: {
                                        Label(
                                            downloadManager.isDownloaded(trackId: track.id) ? "Remove Download" : "Download",
                                            systemImage: downloadManager.isDownloaded(trackId: track.id) ? "trash" : "arrow.down"
                                        )
                                    }
                                    .tint(downloadManager.isDownloaded(trackId: track.id) ? .red : .emeraldGreen)

                                    Button {
                                        audioPlayer.playNext(track)
                                    } label: {
                                        Label("Play Next", systemImage: "text.insert")
                                    }
                                    .tint(.blue)
                                }
                            }
                        }
                        .listStyle(.plain)
                    }
                }
                .padding(.bottom, 60)
            }
            .navigationTitle("Your Library")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showingQueueSheet) {
                PlayQueueView()
            }
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(isSelected ? Color.emeraldGreen : Color(white: 0.16))
                .foregroundColor(isSelected ? .black : .white)
                .cornerRadius(16)
        }
    }
}

// Spotify-style Play Queue View (Android companion parity)
struct PlayQueueView: View {
    @EnvironmentObject var audioPlayer: AudioPlayerService
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()

                VStack {
                    if let current = audioPlayer.currentTrack {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("NOW PLAYING")
                                .font(.system(size: 10, weight: .bold, design: .monospaced))
                                .foregroundColor(.emeraldGreen)
                            HStack(spacing: 12) {
                                AsyncImage(url: URL(string: current.coverUrl)) { img in
                                    img.resizable().scaledToFill()
                                } placeholder: {
                                    Color.gray.opacity(0.3)
                                }
                                .frame(width: 44, height: 44)
                                .cornerRadius(6)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(current.title)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                    Text(current.artist)
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                            }
                            .padding()
                            .background(Color(white: 0.12))
                            .cornerRadius(12)
                        }
                        .padding(.horizontal)
                        .padding(.top)
                    }

                    HStack {
                        Text("Next In Queue")
                            .font(.headline)
                            .foregroundColor(.white)
                        Spacer()
                        Button("Clear Queue") {
                            audioPlayer.clearQueue()
                        }
                        .font(.caption)
                        .foregroundColor(.red)
                    }
                    .padding(.horizontal)
                    .padding(.top, 10)

                    List {
                        ForEach(Array(audioPlayer.queue.enumerated()), id: \.element.id) { index, track in
                            HStack(spacing: 12) {
                                Text("\(index + 1)")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                                    .frame(width: 20)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(track.title)
                                        .font(.subheadline)
                                        .foregroundColor(.white)
                                    Text(track.artist)
                                        .font(.caption2)
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                            }
                            .listRowBackground(Color.clear)
                        }
                        .onDelete { indexSet in
                            indexSet.forEach { audioPlayer.removeFromQueue(at: $0) }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Play Queue")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundColor(.emeraldGreen)
                }
            }
        }
    }
}
