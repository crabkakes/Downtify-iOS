//
//  ViewController.swift
//  Downtify iOS
//
//  Created by Henrique Sebastião & Downtify Contributors.
//  Copyright © 2026 Downtify. All rights reserved.
//

import UIKit
import WebKit

class ViewController: UIViewController, WKUIDelegate, WKNavigationDelegate {
    var webView: WKWebView!
    private var bridge: DowntifyBridge!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupNotifications()
    }
    
    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }
    
    private func setupWebView() {
        let contentController = WKUserContentController()
        bridge = DowntifyBridge(viewController: self)
        contentController.add(bridge, name: "downtifyBridge")
        
        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.backgroundColor = .black
        webView.isOpaque = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = true
        webView.uiDelegate = self
        webView.navigationDelegate = self
        
        view.addSubview(webView)
        
        // Load embedded web app bundle
        if let localUrl = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "public") {
            webView.loadFileURL(localUrl, allowingReadAccessTo: localUrl.deletingLastPathComponent())
        } else if let remoteUrl = URL(string: "http://localhost:3000") {
            webView.load(URLRequest(url: remoteUrl))
        }
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(self, selector: #selector(handleRemotePlay), name: Notification.Name("DowntifyRemotePlay"), object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleRemotePause), name: Notification.Name("DowntifyRemotePause"), object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleRemoteNext), name: Notification.Name("DowntifyRemoteNext"), object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(handleRemotePrev), name: Notification.Name("DowntifyRemotePrev"), object: nil)
    }
    
    @objc private func handleRemotePlay() {
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('downtify:remotePlay'));", completionHandler: nil)
    }
    
    @objc private func handleRemotePause() {
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('downtify:remotePause'));", completionHandler: nil)
    }
    
    @objc private func handleRemoteNext() {
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('downtify:remoteNext'));", completionHandler: nil)
    }
    
    @objc private func handleRemotePrev() {
        webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('downtify:remotePrev'));", completionHandler: nil)
    }
}
