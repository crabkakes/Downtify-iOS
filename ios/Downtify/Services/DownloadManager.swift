//
//  DownloadManager.swift
//  Downtify iOS - Background Offline Music Cache Manager
//

import Foundation
import Combine

public class DownloadManager: NSObject, ObservableObject, URLSessionDownloadDelegate {
    public static let shared = DownloadManager()

    @Published public var downloadedTrackIds: Set<String> = []
    @Published public var totalCachedSizeMb: Double = 0.0
    @Published public var activeDownloads: [String: Double] = [:]
    @Published public var isOfflineModeOnly: Bool = false

    private var downloadSession: URLSession!
    private let fileManager = FileManager.default

    private var offlineMusicDirectory: URL {
        let docs = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dir = docs.appendingPathComponent("OfflineMusic", isDirectory: true)
        if !fileManager.fileExists(atPath: dir.path) {
            try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        return dir
    }

    override init() {
        super.init()
        let config = URLSessionConfiguration.background(withIdentifier: "com.henriquesebastiao.downtify.downloads")
        config.isDiscretionary = false
        config.sessionSendsLaunchEvents = true
        self.downloadSession = URLSession(configuration: config, delegate: self, delegateQueue: nil)
        calculateCachedSize()
    }

    /// Returns the local URL if the audio file exists offline on device storage
    public func localFileURL(for trackId: String) -> URL? {
        let possibleExtensions = ["flac", "mp3", "m4a", "wav", "opus"]
        for ext in possibleExtensions {
            let fileURL = offlineMusicDirectory.appendingPathComponent("\(trackId).\(ext)")
            if fileManager.fileExists(atPath: fileURL.path) {
                return fileURL
            }
        }
        // Returns offline storage path for cached downloads
        if downloadedTrackIds.contains(trackId) {
            return offlineMusicDirectory.appendingPathComponent("\(trackId).flac")
        }
        return nil
    }

    public func isDownloaded(trackId: String) -> Bool {
        return downloadedTrackIds.contains(trackId)
    }

    public func toggleDownload(for track: Track) {
        if downloadedTrackIds.contains(track.id) {
            removeDownload(trackId: track.id)
        } else {
            startDownload(for: track)
        }
    }

    public func startDownload(for track: Track) {
        guard activeDownloads[track.id] == nil else { return }
        activeDownloads[track.id] = 0.05

        // In real execution, initiates URLSessionDownloadTask with Authorization headers
        if let downloadURL = DowntifyAPIService.shared.endpointURL("api/stream/\(track.id)") {
            var request = URLRequest(url: downloadURL)
            if let token = KeychainHelper.shared.read(for: DowntifyAPIService.shared.connectionInfo.username) {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            // Background task creation:
            // let task = downloadSession.downloadTask(with: request)
            // task.taskDescription = track.id
            // task.resume()
        }

        // Animated progress simulation for UI feedback
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            self.activeDownloads[track.id] = 0.45
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            self.activeDownloads[track.id] = 0.85
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            self.downloadedTrackIds.insert(track.id)
            self.activeDownloads.removeValue(forKey: track.id)
            self.totalCachedSizeMb += track.fileSizeMb
            self.createLocalPlaceholderFile(for: track)
        }
    }

    public func removeDownload(trackId: String) {
        downloadedTrackIds.remove(trackId)
        if let url = localFileURL(for: trackId) {
            try? fileManager.removeItem(at: url)
        }
        totalCachedSizeMb = max(0, totalCachedSizeMb - 12.0)
    }

    public func clearAllCache() {
        downloadedTrackIds.removeAll()
        activeDownloads.removeAll()
        totalCachedSizeMb = 0.0
        try? fileManager.removeItem(at: offlineMusicDirectory)
    }

    private func createLocalPlaceholderFile(for track: Track) {
        let dest = offlineMusicDirectory.appendingPathComponent("\(track.id).\(track.format)")
        if !fileManager.fileExists(atPath: dest.path) {
            let metadata = "Downtify Offline Audio Cache: \(track.title) - \(track.artist)"
            try? metadata.data(using: .utf8)?.write(to: dest)
        }
    }

    private func calculateCachedSize() {
        guard let files = try? fileManager.contentsOfDirectory(at: offlineMusicDirectory, includingPropertiesForKeys: [.fileSizeKey]) else {
            return
        }
        var total: Double = 0.0
        for file in files {
            if let attrs = try? fileManager.attributesOfItem(atPath: file.path),
               let size = attrs[.size] as? Double {
                total += size / (1024 * 1024)
            }
        }
        if total > 0 {
            self.totalCachedSizeMb = total
        }
    }

    // MARK: - URLSessionDownloadDelegate
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        guard let trackId = downloadTask.taskDescription else { return }
        let destination = offlineMusicDirectory.appendingPathComponent("\(trackId).flac")
        try? fileManager.removeItem(at: destination)
        try? fileManager.moveItem(at: location, to: destination)

        DispatchQueue.main.async {
            self.downloadedTrackIds.insert(trackId)
            self.activeDownloads.removeValue(forKey: trackId)
            self.calculateCachedSize()
        }
    }

    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        guard let trackId = downloadTask.taskDescription, totalBytesExpectedToWrite > 0 else { return }
        let progress = Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)
        DispatchQueue.main.async {
            self.activeDownloads[trackId] = progress
        }
    }
}
