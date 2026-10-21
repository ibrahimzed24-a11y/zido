import Foundation
import Security

/// Stores the device key in the login Keychain (service ai.zido.mac).
enum Keychain {
    private static let service = "ai.zido.mac"
    private static let account = "deviceKey"

    private static var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service, kSecAttrAccount as String: account]
    }

    static func saveDeviceKey(_ key: String) {
        deleteDeviceKey()
        var item = query
        item[kSecValueData as String] = Data(key.utf8)
        item[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(item as CFDictionary, nil)
    }

    static func loadDeviceKey() -> String? {
        var q = query
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let data = out as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func deleteDeviceKey() {
        SecItemDelete(query as CFDictionary)
    }
}
