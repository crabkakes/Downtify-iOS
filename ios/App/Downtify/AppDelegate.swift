//
//  AppDelegate.swift
//  Downtify iOS
//
//  Created by Henrique Sebastião & Downtify Contributors.
//  Copyright © 2026 Downtify. All rights reserved.
//

import UIKit
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Activate background audio session immediately on launch
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetooth])
            try session.setActive(true)
        } catch {
            print("Error activating AVAudioSession on app launch: \(error)")
        }
        
        window = UIWindow(frame: UIScreen.main.bounds)
        let viewController = ViewController()
        window?.rootViewController = viewController
        window?.makeKeyAndVisible()
        
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Keep background playback running smoothly
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Audio continues under UIBackgroundModes: audio
    }
}
