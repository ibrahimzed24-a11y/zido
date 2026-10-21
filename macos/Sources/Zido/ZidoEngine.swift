import SwiftUI
import ZidoCore

@MainActor
final class ZidoEngine: ObservableObject {
    static let shared = ZidoEngine()
    static let deviceKeyDefaultsKey = "zidoDeviceKey"

    let model = ZidoModel()
    @Published private(set) var deviceKey: String

    private init() {
        deviceKey = UserDefaults.standard.string(forKey: Self.deviceKeyDefaultsKey) ?? ""
    }

    /// Stores the device key in UserDefaults and links this Mac with it.
    func saveDeviceKey(_ key: String) {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        deviceKey = trimmed
        UserDefaults.standard.set(trimmed, forKey: Self.deviceKeyDefaultsKey)
        Task { await model.link(key: trimmed) }
    }

    /// The plan Zido runs as, from the plan the server sends in the heartbeat.
    /// Founder Override: the founder's GitHub account is forced to MAX whatever the server says.
    static func resolvePlan(for user: HeartbeatResponse.User) -> String {
        PlanPolicy.effectivePlan(serverPlan: user.plan, login: user.login)
    }
}
