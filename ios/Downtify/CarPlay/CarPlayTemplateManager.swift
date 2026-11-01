//
//  CarPlayTemplateManager.swift
//  Downtify iOS
//  Manages Apple CarPlay templates: CPTabBarTemplate, CPListTemplate, CPNowPlayingTemplate
//

import UIKit
import CarPlay

public class CarPlayTemplateManager {
    public static let shared = CarPlayTemplateManager()
    public weak var interfaceController: CPInterfaceController?

    public func buildRootTemplate() -> CPTemplate {
        let homeTemplate = buildHomeTemplate()
        let libraryTemplate = buildLibraryTemplate()
        
        let tabBar = CPTabBarTemplate(templates: [homeTemplate, libraryTemplate])
        return tabBar
    }

    private func buildHomeTemplate() -> CPListTemplate {
        var items: [CPListItem] = []

        // Liked Songs item
        let likedItem = CPListItem(
            text: "Liked Songs",
            detailText: "Favorite tracks on Downtify server",
            image: UIImage(systemName: "heart.fill")
        )
        likedItem.handler = { [weak self] item, completion in
            // Play first liked track
            if let first = DowntifyAPIService.shared.tracks.first(where: { $0.isLiked }) {
                AudioPlayerService.shared.playTrack(first)
                self?.pushNowPlaying()
            }
            completion()
        }
        items.append(likedItem)

        // Add recent server tracks
        for track in DowntifyAPIService.shared.tracks.prefix(6) {
            let item = CPListItem(
                text: track.title,
                detailText: "\(track.artist) · \(track.album)",
                image: UIImage(systemName: "music.note")
            )
            item.handler = { [weak self] _, completion in
                AudioPlayerService.shared.playTrack(track)
                self?.pushNowPlaying()
                completion()
            }
            items.append(item)
        }

        let section = CPListSection(items: items)
        let listTemplate = CPListTemplate(title: "Home", sections: [section])
        listTemplate.tabImage = UIImage(systemName: "house.fill")
        return listTemplate
    }

    private func buildLibraryTemplate() -> CPListTemplate {
        var items: [CPListItem] = []

        // Offline tracks filter
        let offlineItem = CPListItem(
            text: "Downloaded for Offline",
            detailText: "\(DownloadManager.shared.downloadedTrackIds.count) cached tracks",
            image: UIImage(systemName: "arrow.down.circle.fill")
        )
        offlineItem.handler = { [weak self] _, completion in
            completion()
        }
        items.append(offlineItem)

        // Server Playlists
        for playlist in DowntifyAPIService.shared.playlists {
            let item = CPListItem(
                text: playlist.name,
                detailText: "\(playlist.trackIds.count) tracks",
                image: UIImage(systemName: "music.note.list")
            )
            item.handler = { [weak self] _, completion in
                if let firstId = playlist.trackIds.first,
                   let track = DowntifyAPIService.shared.tracks.first(where: { $0.id == firstId }) {
                    AudioPlayerService.shared.playTrack(track)
                    self?.pushNowPlaying()
                }
                completion()
            }
            items.append(item)
        }

        let section = CPListSection(items: items)
        let listTemplate = CPListTemplate(title: "Library", sections: [section])
        listTemplate.tabImage = UIImage(systemName: "books.vertical.fill")
        return listTemplate
    }

    public func pushNowPlaying() {
        let nowPlaying = CPNowPlayingTemplate.shared
        // Configure now playing buttons: like button, skip forward, etc.
        nowPlaying.isUpNextButtonEnabled = true
        nowPlaying.isAlbumArtistButtonEnabled = true
        
        interfaceController?.pushTemplate(nowPlaying, animated: true, completion: nil)
    }
}
