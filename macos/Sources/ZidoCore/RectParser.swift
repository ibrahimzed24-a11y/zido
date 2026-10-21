import CoreGraphics
import Foundation

/// A highlight from Zido's reply: `[RECT: x, y, w, h, label]`, in screenshot pixels with a top-left origin.
public struct ZidoRect: Equatable, Codable {
    public var x: Double
    public var y: Double
    public var w: Double
    public var h: Double
    public var label: String

    public init(x: Double, y: Double, w: Double, h: Double, label: String) {
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.label = label
    }
}

public enum RectParser {
    static let pattern = #"\[RECT:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*([^\]]*?)\s*\]"#

    public static func parse(_ text: String) -> (clean: String, rects: [ZidoRect]) {
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return (text, []) }
        let ns = text as NSString
        let range = NSRange(location: 0, length: ns.length)
        var rects: [ZidoRect] = []
        for match in regex.matches(in: text, range: range) {
            func group(_ i: Int) -> String { ns.substring(with: match.range(at: i)) }
            rects.append(ZidoRect(
                x: Double(group(1)) ?? 0,
                y: Double(group(2)) ?? 0,
                w: Double(group(3)) ?? 0,
                h: Double(group(4)) ?? 0,
                label: group(5)
            ))
        }
        let clean = regex.stringByReplacingMatches(in: text, range: range, withTemplate: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return (clean, rects)
    }

    /// Maps a rect from screenshot pixels into a view of `viewSize` (both top-left origin), e.g. the overlay.
    public static func toView(_ r: ZidoRect, imageSize: CGSize, viewSize: CGSize) -> CGRect {
        guard imageSize.width > 0, imageSize.height > 0 else { return .zero }
        let sx = viewSize.width / imageSize.width
        let sy = viewSize.height / imageSize.height
        return CGRect(x: r.x * sx, y: r.y * sy, width: r.w * sx, height: r.h * sy)
    }

    /// Centre of a rect in global display coordinates (top-left origin), as `CGEvent` expects.
    public static func centerInGlobal(_ r: ZidoRect, imageSize: CGSize, displayBounds: CGRect) -> CGPoint {
        let local = toView(r, imageSize: imageSize, viewSize: displayBounds.size)
        return CGPoint(x: displayBounds.minX + local.midX, y: displayBounds.minY + local.midY)
    }
}
