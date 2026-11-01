//
//  DownloadManager.swift
//  Downtify iOS
//

import Foundation
import Combine

public class DownloadManager: NSObject, ObservableObject, URLSessionDownloadDelegate {
    public static let shared = DownloadManager()

    @Published public var downloadedTrackIds: Set<String> = ["track-1", "track-2"]
    @Published public var totalCachedSizeMb: Double = 34.4
    @Published public var activeDownloads: [String: Double] = [:]

    private var downloadSession: URLSession!

    override init() {
        super.init()
        let config = URLSessionConfiguration.background(withIdentifier: "com.downtify.ios.downloads")
        self.downloadSession = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }

    public func toggleDownload(for track: Track) {
        if downloadedTrackIds.contains(track.id) {
            removeDownload(trackId: track.id)
        } else {
            startDownload(for: track)
        }
    }

    public func startDownload(for track: Track) {
        activeDownloads[track.id] = 0.1
        // Simulate background stream caching into app sandbox documents directory
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            self.downloadedTrackIds.insert(track.id)
            self.activeDownloads.removeValue(forKey: track.id)
            self.totalCachedSizeMb += track.fileSizeMb
        }
    }

    public func removeDownload(trackId: String) {
        downloadedTrackIds.remove(trackId)
        totalCachedSizeMb = max(0, totalCachedSizeMb - 8.5)
    }

    public func clearAllCache() {
        downloadedTrackIds.removeAll()
        totalCachedSizeMb = 0.0
    }

    // URLSessionDownloadDelegate
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        // Save file to Documents/Music
    }
}
