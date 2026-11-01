//
//  MainTabView.swift
//  Downtify iOS
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var apiService: DowntifyAPIService
    @EnvironmentObject var audioPlayer: AudioPlayerService
    @EnvironmentObject var downloadManager: DownloadManager

    @State private var selectedTab = 0
    @State private var isShowingNowPlaying = false

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                HomeView()
                    .tabItem {
                        Label("Home", systemImage: "house.fill")
                    }
                    .tag(0)

                SearchView()
                    .tabItem {
                        Label("Search", systemImage: "magnifyingglass")
                    }
                    .tag(1)

                LibraryView()
                    .tabItem {
                        Label("Your Library", systemImage: "books.vertical.fill")
                    }
                    .tag(2)

                SettingsView()
                    .tabItem {
                        Label("Settings", systemImage: "gearshape.fill")
                    }
                    .tag(3)
            }
            .accentColor(.emeraldGreen)

            // Mini player bar
            if let track = audioPlayer.currentTrack {
                MiniPlayerView(track: track)
                    .padding(.bottom, 49)
                    .onTapGesture {
                        isShowingNowPlaying = true
                    }
            }
        }
        .sheet(isPresented: $isShowingNowPlaying) {
            if let track = audioPlayer.currentTrack {
                NowPlayingView(track: track)
            }
        }
    }
}

struct MiniPlayerView: View {
    let track: Track
    @EnvironmentObject var audioPlayer: AudioPlayerService

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: track.coverUrl)) { img in
                img.resizable().scaledToFill()
            } placeholder: {
                Color.gray.opacity(0.3)
            }
            .frame(width: 42, height: 42)
            .cornerRadius(8)

            VStack(alignment: .leading, spacing: 2) {
                Text(track.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(track.artist)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .lineLimit(1)
            }

            Spacer()

            Button {
                audioPlayer.togglePlayPause()
            } label: {
                Image(systemName: audioPlayer.isPlaying ? "pause.fill" : "play.fill")
                    .font(.title3)
                    .foregroundColor(.white)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(Color(white: 0.12).opacity(0.95))
        .cornerRadius(14)
        .padding(.horizontal, 8)
    }
}

extension Color {
    static let emeraldGreen = Color(red: 16/255, green: 185/255, blue: 129/255)
}
