//
//  KeychainHelper.swift
//  Downtify iOS - Hardware-Backed Secure Credential Storage
//

import Foundation
import Security

/// Thread-safe helper that stores server auth tokens in the iOS Keychain
/// rather than plaintext UserDefaults, preventing credential theft via backups or memory dumps.
public final class KeychainHelper: @unchecked Sendable {
    public static let shared = KeychainHelper()

    private let serviceName = "com.henriquesebastiao.downtify.keychain"

    private init() {}

    /// Saves or updates a token securely in the Keychain
    @discardableResult
    public func save(token: String, for account: String) -> Bool {
        guard let data = token.data(using: .utf8) else { return false }

        // Remove existing item if present
        delete(for: account)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: account,
            kSecValueData as String: data,
            // Accessible only when device is unlocked, never migrated to unencrypted backups
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    /// Reads a token securely from the Keychain
    public func read(for account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        guard status == errSecSuccess,
              let data = item as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
    }

    /// Deletes credentials for an account from the Keychain
    @discardableResult
    public func delete(for account: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: account
        ]

        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    /// Clears all stored Downtify tokens (e.g. on Sign Out)
    public func clearAll() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName
        ]
        SecItemDelete(query as CFDictionary)
    }
}
