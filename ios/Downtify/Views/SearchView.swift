//
//  SearchView.swift
//  Downtify iOS
//

import SwiftUI

struct SearchView: View {
    @EnvironmentObject var apiService: DowntifyAPIService
    @EnvironmentObject var audioPlayer: AudioPlayerService
    @EnvironmentObject var downloadManager: DownloadManager

    @State private var searchText = ""
    @State private var downloadUrlInput = ""
    @State private var selectedFormat = "flac"
    @State private var selectedBitrate = "lossless"

    var filteredTracks: [Track] {
        if searchText.trimmingCharacters(in: .whitespaces).isEmpty {
            return apiService.tracks
        }
        let query = searchText.lowercased()
        return apiService.tracks.filter {
            $0.title.lowercased().contains(query) ||
            $0.artist.lowercased().contains(query) ||
            $0.album.lowercased().contains(query) ||
            $0.genre.lowercased().contains(query)
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        // Search Bar
                        HStack(spacing: 8) {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.gray)
                            TextField("Search tracks, artists, or albums...", text: $searchText)
                                .foregroundColor(.white)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                            if !searchText.isEmpty {
                                Button { searchText = "" } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                        .padding(12)
                        .background(Color(white: 0.12))
                        .cornerRadius(12)
                        .padding(.horizontal)

                        // Server Remote Downloader (Android parity)
                        VStack(alignment: .leading, spacing: 8) {
                            Text("DOWNLOAD FROM URL TO SERVER")
                                .font(.system(size: 11, weight: .bold, design: .monospaced))
                                .foregroundColor(.emeraldGreen)

                            HStack(spacing: 8) {
                                TextField("Paste Spotify, YT Music, or Soundcloud URL", text: $downloadUrlInput)
                                    .font(.caption)
                                    .padding(10)
                                    .background(Color(white: 0.08))
                                    .cornerRadius(8)
                                    .foregroundColor(.white)
                                    .autocapitalization(.none)

                                Button {
                                    guard !downloadUrlInput.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                                    apiService.requestServerDownload(
                                        url: downloadUrlInput.trimmingCharacters(in: .whitespaces),
                                        format: selectedFormat,
                                        bitrate: selectedBitrate
                                    )
                                    downloadUrlInput = ""
                                } label: {
                                    Image(systemName: "arrow.down.to.line")
                                        .font(.subheadline)
                                        .foregroundColor(.black)
                                        .frame(width: 36, height: 36)
                                        .background(Color.emeraldGreen)
                                        .cornerRadius(8)
                                }
                            }
                        }
                        .padding()
                        .background(Color(white: 0.10))
                        .cornerRadius(14)
                        .padding(.horizontal)

                        // Track List
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Tracks (\(filteredTracks.count))")
                                .font(.headline)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal)

                            ForEach(filteredTracks) { track in
                                Button {
                                    audioPlayer.playTrack(track)
                                } label: {
                                    HStack(spacing: 12) {
                                        AsyncImage(url: URL(string: track.coverUrl)) { img in
                                            img.resizable().scaledToFill()
                                        } placeholder: {
                                            Color.gray.opacity(0.3)
                                        }
                                        .frame(width: 48, height: 48)
                                        .cornerRadius(8)

                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(track.title)
                                                .font(.subheadline)
                                                .fontWeight(.semibold)
                                                .foregroundColor(.white)
                                                .lineLimit(1)
                                            Text("\(track.artist) • \(track.album)")
                                                .font(.caption2)
                                                .foregroundColor(.gray)
                                                .lineLimit(1)
                                        }

                                        Spacer()

                                        // Offline Cache Status Icon
                                        Button {
                                            downloadManager.toggleDownload(for: track)
                                        } label: {
                                            Image(systemName: downloadManager.isDownloaded(trackId: track.id) ? "checkmark.circle.fill" : "arrow.down.circle")
                                                .font(.system(size: 20))
                                                .foregroundColor(downloadManager.isDownloaded(trackId: track.id) ? .emeraldGreen : .gray)
                                                .frame(width: 44, height: 44)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                        }
                    }
                    .padding(.vertical)
                    .padding(.bottom, 60)
                }
            }
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}
