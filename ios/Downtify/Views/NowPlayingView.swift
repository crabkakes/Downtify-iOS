//
//  NowPlayingView.swift
//  Downtify iOS
//

import SwiftUI

struct NowPlayingView: View {
    let track: Track
    @EnvironmentObject var audioPlayer: AudioPlayerService
    @EnvironmentObject var downloadManager: DownloadManager
    @EnvironmentObject var apiService: DowntifyAPIService
    @Environment(\.dismiss) var dismiss

    @State private var showingLyrics = false
    @State private var showingQueue = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 20) {
                // Top bar
                HStack {
                    Button { dismiss() } label: {
                        Image(systemName: "chevron.down")
                            .font(.title3)
                            .foregroundColor(.white)
                    }
                    Spacer()
                    VStack {
                        Text("PLAYING FROM SERVER")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.gray)
                        Text(track.album)
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                    }
                    Spacer()
                    Button {
                        downloadManager.toggleDownload(for: track)
                    } label: {
                        Image(systemName: downloadManager.downloadedTrackIds.contains(track.id) ? "arrow.down.circle.fill" : "arrow.down.circle")
                            .font(.title3)
                            .foregroundColor(.emeraldGreen)
                    }
                }
                .padding(.horizontal)

                if showingLyrics {
                    LyricsScrollView(lyrics: track.lyrics, currentTime: audioPlayer.currentTime) { time in
                        audioPlayer.seek(to: time)
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    Spacer()
                    // Artwork
                    AsyncImage(url: URL(string: track.coverUrl)) { img in
                        img.resizable().scaledToFill()
                    } placeholder: {
                        Color.gray.opacity(0.3)
                    }
                    .frame(width: 290, height: 290)
                    .cornerRadius(24)
                    .shadow(color: .black.opacity(0.6), radius: 20)

                    Spacer()

                    // Title & Artist & Like
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(track.title)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            Text(track.artist)
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                        Spacer()
                        Button {
                            apiService.toggleLikeTrack(trackId: track.id)
                        } label: {
                            Image(systemName: track.isLiked ? "heart.fill" : "heart")
                                .font(.title2)
                                .foregroundColor(track.isLiked ? .emeraldGreen : .gray)
                        }
                    }
                    .padding(.horizontal)

                    // Scrubber
                    VStack(spacing: 6) {
                        Slider(value: Binding(
                            get: { audioPlayer.currentTime },
                            set: { audioPlayer.seek(to: $0) }
                        ), in: 0...audioPlayer.duration)
                        .accentColor(.white)

                        HStack {
                            Text(formatTime(audioPlayer.currentTime))
                            Spacer()
                            Text(formatTime(audioPlayer.duration))
                        }
                        .font(.caption2)
                        .foregroundColor(.gray)
                    }
                    .padding(.horizontal)

                    // Transport controls
                    HStack(spacing: 36) {
                        Button { audioPlayer.isShuffle.toggle() } label: {
                            Image(systemName: "shuffle")
                                .foregroundColor(audioPlayer.isShuffle ? .emeraldGreen : .gray)
                        }

                        Button { audioPlayer.prevTrack() } label: {
                            Image(systemName: "backward.fill")
                                .font(.title)
                                .foregroundColor(.white)
                        }

                        Button { audioPlayer.togglePlayPause() } label: {
                            Image(systemName: audioPlayer.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                                .font(.system(size: 64))
                                .foregroundColor(.white)
                        }

                        Button { audioPlayer.nextTrack() } label: {
                            Image(systemName: "forward.fill")
                                .font(.title)
                                .foregroundColor(.white)
                        }

                        Button { showingLyrics.toggle() } label: {
                            Image(systemName: "quote.bubble.fill")
                                .foregroundColor(showingLyrics ? .emeraldGreen : .gray)
                        }
                    }
                    .padding(.vertical)
                }

                // Bottom bar
                HStack {
                    Button { showingLyrics.toggle() } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "mic.fill")
                            Text("Lyrics")
                        }
                        .font(.caption)
                        .foregroundColor(showingLyrics ? .emeraldGreen : .gray)
                    }
                    Spacer()
                    Button { /* AirPlay */ } label: {
                        Image(systemName: "airplayaudio")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.top)
        }
    }

    private func formatTime(_ secs: Double) -> String {
        let m = Int(secs) / 60
        let s = Int(secs) % 60
        return String(format: "%d:%02d", m, s)
    }
}

struct LyricsScrollView: View {
    let lyrics: [LyricLine]
    let currentTime: Double
    let onSeek: (Double) -> Void

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 24) {
                    ForEach(Array(lyrics.enumerated()), id: \.offset) { idx, line in
                        let isActive = isLineActive(lineIndex: idx)
                        Text(line.text)
                            .font(.system(size: isActive ? 26 : 20, weight: isActive ? .bold : .medium))
                            .foregroundColor(isActive ? .white : .gray.opacity(0.4))
                            .scaleEffect(isActive ? 1.04 : 1.0)
                            .id(idx)
                            .onTapGesture {
                                onSeek(line.time)
                            }
                    }
                }
                .padding(.vertical, 180) // Centering padding
            }
            .onChange(of: currentTime) { _ in
                if let activeIndex = getActiveIndex() {
                    withAnimation(.easeInOut(duration: 0.4)) {
                        proxy.scrollTo(activeIndex, anchor: .center)
                    }
                }
            }
        }
    }

    private func getActiveIndex() -> Int? {
        lyrics.lastIndex(where: { currentTime >= $0.time })
    }

    private func isLineActive(lineIndex: Int) -> Bool {
        return getActiveIndex() == lineIndex
    }
}
