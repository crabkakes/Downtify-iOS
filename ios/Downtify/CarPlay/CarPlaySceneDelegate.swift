//
//  CarPlaySceneDelegate.swift
//  Downtify iOS
//  Apple CarPlay integration for Downtify
//

import UIKit
import CarPlay

class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    var interfaceController: CPInterfaceController?

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController
        CarPlayTemplateManager.shared.interfaceController = interfaceController
        
        let rootTemplate = CarPlayTemplateManager.shared.buildRootTemplate()
        interfaceController.setRootTemplate(rootTemplate, animated: true, completion: nil)
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController: CPInterfaceController
    ) {
        self.interfaceController = nil
        CarPlayTemplateManager.shared.interfaceController = nil
    }
}
