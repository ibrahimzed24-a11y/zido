import AppKit
import CoreGraphics
import ZidoCore

struct Screenshot {
    let base64: String
    let size: ScreenSize
}

/// Captures the main display with CGWindowListCreateImage. Zido's own windows use sharingType .none, so they are not in the shot.
enum ScreenCapture {
    static let maxDimension: CGFloat = 1568

    static func captureMainDisplay() -> Screenshot? {
        let bounds = CGDisplayBounds(CGMainDisplayID())
        guard let image = CGWindowListCreateImage(bounds, .optionOnScreenOnly, kCGNullWindowID, [.bestResolution]) else { return nil }
        let scaled = downscale(image)
        let rep = NSBitmapImageRep(cgImage: scaled)
        guard let jpeg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.7]) else { return nil }
        return Screenshot(base64: jpeg.base64EncodedString(), size: ScreenSize(width: scaled.width, height: scaled.height))
    }

    private static func downscale(_ image: CGImage) -> CGImage {
        let w = CGFloat(image.width), h = CGFloat(image.height)
        let scale = min(1, maxDimension / max(w, h))
        guard scale < 1 else { return image }
        let size = CGSize(width: (w * scale).rounded(), height: (h * scale).rounded())
        guard let ctx = CGContext(data: nil, width: Int(size.width), height: Int(size.height), bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { return image }
        ctx.interpolationQuality = .high
        ctx.draw(image, in: CGRect(origin: .zero, size: size))
        return ctx.makeImage() ?? image
    }
}
