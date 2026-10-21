import Foundation

/// A local copy of the user's PROFILE.md and VOLATILE.md, kept in Application Support.
/// The server holds the source of truth; this lets the notch show recent context offline.
public final class MemoryStore {
    public static let profileFile = "PROFILE.md"
    public static let volatileFile = "VOLATILE.md"
    public static let volatileMaxLines = 40

    public let directory: URL

    public init(directory: URL) {
        self.directory = directory
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    public static func defaultDirectory() -> URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        return base.appendingPathComponent("Zido", isDirectory: true)
    }

    public func read(_ name: String) -> String {
        (try? String(contentsOf: directory.appendingPathComponent(name), encoding: .utf8)) ?? ""
    }

    public func write(_ name: String, _ content: String) {
        try? content.write(to: directory.appendingPathComponent(name), atomically: true, encoding: .utf8)
    }

    /// Adds a line to VOLATILE.md, keeping only the newest `volatileMaxLines` entries.
    public func appendVolatile(_ entry: String, date: Date = Date()) {
        let stamp = ISO8601DateFormatter().string(from: date)
        let clean = entry.replacingOccurrences(of: "\n", with: " ")
        var lines = read(Self.volatileFile).split(separator: "\n").map(String.init).filter { !$0.isEmpty }
        lines.append("- \(stamp) \(clean)")
        write(Self.volatileFile, lines.suffix(Self.volatileMaxLines).joined(separator: "\n") + "\n")
    }
}
