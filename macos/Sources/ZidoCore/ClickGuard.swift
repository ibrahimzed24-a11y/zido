import Foundation
import CoreGraphics

/// The rules every synthetic click must pass before a CGEvent is posted.
public struct ClickGuard {
    public enum Verdict: Equatable { case allowed, notTrusted, outOfBounds, tooSoon, notConfirmed }

    public var minInterval: TimeInterval
    public private(set) var lastClick: Date?

    public init(minInterval: TimeInterval = 1.0) { self.minInterval = minInterval }

    public func check(point: CGPoint, displays: [CGRect], trusted: Bool, confirmed: Bool, now: Date = Date()) -> Verdict {
        guard trusted else { return .notTrusted }
        guard displays.contains(where: { $0.contains(point) }) else { return .outOfBounds }
        if let last = lastClick, now.timeIntervalSince(last) < minInterval { return .tooSoon }
        guard confirmed else { return .notConfirmed }
        return .allowed
    }

    public mutating func record(_ date: Date = Date()) { lastClick = date }
}
