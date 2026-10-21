import Foundation

/// Which plan the Mac app runs as, and whether its usage is unlimited.
public enum PlanPolicy {
    /// Founder Override: these GitHub logins always run as Max in the app, so every Max feature can be tested locally.
    public static let founderLogins: Set<String> = ["ibrahimzed24-a11y"]

    public static func isFounder(login: String?) -> Bool {
        guard let login else { return false }
        return founderLogins.contains(login.lowercased())
    }

    /// The plan from the server, except that a founder account is always "MAX".
    public static func effectivePlan(serverPlan: String, login: String?) -> String {
        isFounder(login: login) ? "MAX" : serverPlan.uppercased()
    }

    public static func isUnlimited(plan: String) -> Bool {
        plan.uppercased() == "MAX"
    }
}
