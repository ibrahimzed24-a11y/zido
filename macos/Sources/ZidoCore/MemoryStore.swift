import Foundation

/// Local copies of PROFILE.md (lasting facts) and VOLATILE.md (recent context) in Application Support.
public final class MemoryStore {
    public static let profileFile = "PROFILE.md"
    public static let volatileFile = "VOLATILE.md"

    public let directory: URL
    public var profileURL: URL { directory.appendingPathComponent(Self.profileFile) }
    public var volatileURL: URL { directory.appendingPathComponent(Self.volatileFile) }

    public init(directory: URL) {
        self.directory = directory
    }

    public func ensureFiles() throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        for (url, title) in [(profileURL, Self.profileFile), (volatileURL, Self.volatileFile)] where !FileManager.default.fileExists(atPath: url.path) {
            try "# \(title)\n\n".write(to: url, atomically: true, encoding: .utf8)
        }
    }

    public func read(_ url: URL) -> String {
        (try? String(contentsOf: url, encoding: .utf8)) ?? ""
    }

    public func appendVolatile(_ entry: String, now: Date = Date(), maxLines: Int = 40) throws {
        try ensureFiles()
        var lines = read(volatileURL).components(separatedBy: "\n").filter { $0.hasPrefix("- ") }
        let flat = entry.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ")
        lines.append("- \(ISO8601DateFormatter().string(from: now)) \(flat)")
        let body = "# \(Self.volatileFile)\n\n" + lines.suffix(maxLines).joined(separator: "\n") + "\n"
        try body.write(to: volatileURL, atomically: true, encoding: .utf8)
    }
}
