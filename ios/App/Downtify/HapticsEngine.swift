//
//  HapticsEngine.swift
//  Downtify iOS
//
//  Created by Henrique Sebastião & Downtify Contributors.
//  Copyright © 2026 Downtify. All rights reserved.
//

import UIKit

public class HapticsEngine {
    public static let shared = HapticsEngine()
    
    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let rigidImpact = UIImpactFeedbackGenerator(style: .rigid)
    private let softImpact = UIImpactFeedbackGenerator(style: .soft)
    private let selectionFeedback = UISelectionFeedbackGenerator()
    private let notificationFeedback = UINotificationFeedbackGenerator()
    
    public func trigger(_ style: String) {
        DispatchQueue.main.async {
            switch style {
            case "light":
                self.lightImpact.impactOccurred()
            case "medium":
                self.mediumImpact.impactOccurred()
            case "heavy":
                self.heavyImpact.impactOccurred()
            case "rigid":
                self.rigidImpact.impactOccurred()
            case "soft":
                self.softImpact.impactOccurred()
            case "selection":
                self.selectionFeedback.selectionChanged()
            case "success":
                self.notificationFeedback.notificationOccurred(.success)
            case "warning":
                self.notificationFeedback.notificationOccurred(.warning)
            case "error":
                self.notificationFeedback.notificationOccurred(.error)
            default:
                self.lightImpact.impactOccurred()
            }
        }
    }
}
