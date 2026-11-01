//
//  DowntifyBridge.swift
//  Downtify iOS
//
//  Created by Henrique Sebastião & Downtify Contributors.
//  Copyright © 2026 Downtify. All rights reserved.
//

import UIKit
import WebKit

public class DowntifyBridge: NSObject, WKScriptMessageHandler {
    weak var viewController: UIViewController?
    
    init(viewController: UIViewController) {
        self.viewController = viewController
        super.init()
    }
    
    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "downtifyBridge",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            return
        }
        
        let payload = body["payload"] as? [String: Any] ?? [:]
        
        switch action {
        case "triggerHaptic":
            if let style = payload["style"] as? String {
                HapticsEngine.shared.trigger(style)
            }
            
        case "updateNowPlaying":
            let title = payload["title"] as? String ?? ""
            let artist = payload["artist"] as? String ?? ""
            let album = payload["albumTitle"] as? String ?? ""
            let artworkUrl = payload["artworkUrl"] as? String
            let duration = payload["duration"] as? Double ?? 0.0
            let currentTime = payload["elapsedTime"] as? Double ?? 0.0
            
            AudioPlayerEngine.shared.updateNowPlayingInfo(
                title: title,
                artist: artist,
                album: album,
                artworkUrl: artworkUrl,
                duration: duration,
                currentTime: currentTime
            )
            
        case "clearNowPlaying":
            AudioPlayerEngine.shared.pause()
            
        case "saveFileToDocuments":
            if let filename = payload["filename"] as? String {
                print("Saving file \(filename) to iOS Documents directory for Files.app access")
            }
            
        case "presentShareSheet":
            if let title = payload["title"] as? String {
                DispatchQueue.main.async { [weak self] in
                    let activityVC = UIActivityViewController(activityItems: [title], applicationActivities: nil)
                    self?.viewController?.present(activityVC, animated: true)
                }
            }
            
        default:
            break
        }
    }
}
