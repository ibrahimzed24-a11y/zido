import Foundation
import CoreGraphics

/// Reads [RECT: x, y, w, h, label] tags and maps normalized rects into view or screen coordinates.
public enum RectParser {
    private static let pattern = #"\[RECT:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*([^\]]*?)\s*\]"#

    /// Parses tags in the exact form [RECT: x, y, w, h, label]. Values above 1 are treated as a 0-1000 grid.
    public static func parse(_ text: String) -> [NormRect] {
        guard let re = try? NSRegularExpression(pattern: pattern) else { return [] }
        let ns = text as NSString
        return re.matches(in: text, range: NSRange(location: 0, length: ns.length)).compactMap { m in
            let v = (1...4).compactMap { Double(ns.substring(with: m.range(at: $0))) }
            guard v.count == 4 else { return nil }
            let label = ns.substring(with: m.range(at: 5))
            return normalize(NormRect(x: v[0], y: v[1], w: v[2], h: v[3], label: label))
        }
    }

    /// Clamps to the unit square; nil when nothing is left.
    public static func normalize(_ r: NormRect) -> NormRect? {
        let scale = max(r.x, r.y, r.w, r.h) > 1 ? 1000.0 : 1.0
        let x = min(max(r.x / scale, 0), 1)
        let y = min(max(r.y / scale, 0), 1)
        let w = min(max(r.w / scale, 0), 1 - x)
        let h = min(max(r.h / scale, 0), 1 - y)
        guard w > 0, h > 0 else { return nil }
        let label = r.label.trimmingCharacters(in: .whitespacesAndNewlines)
        return NormRect(x: x, y: y, w: w, h: h, label: label.isEmpty ? "here" : String(label.prefix(60)))
    }

    /// Maps a normalized rect into a view of `size`. AppKit views are bottom-left based, so `flipped` defaults to false.
    public static func toView(_ r: NormRect, size: CGSize, flipped: Bool = false) -> CGRect {
        let w = r.w * size.width
        let h = r.h * size.height
        let x = r.x * size.width
        let y = flipped ? r.y * size.height : (1 - r.y - r.h) * size.height
        return CGRect(x: x, y: y, width: w, height: h)
    }

    /// The centre of a rect in global display coordinates (top-left origin), as CGEvent expects.
    public static func clickPoint(_ r: NormRect, displayBounds: CGRect) -> CGPoint {
        CGPoint(x: displayBounds.minX + (r.x + r.w / 2) * displayBounds.width,
                y: displayBounds.minY + (r.y + r.h / 2) * displayBounds.height)
    }
}
