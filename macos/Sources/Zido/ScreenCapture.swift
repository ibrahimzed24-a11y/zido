import AppKit
import CoreGraphics

struct Screenshot {
    let pixelSize: CGSize
    let base64: String
    let mediaType: String
}

/// Captures the main display with CGWindowListCreateImage. Zido's own windows set sharingType = .none, so they are left out.
final class ScreenCapture {
    /// Longest side sent to Claude; larger screenshots are scaled down to keep requests small.
    let maxSide = 1568

    func hasPermission() -> Bool {
        CGPreflightScreenCaptureAccess()
    }

    func captureMainDisplay() -> Screenshot? {
        guard hasPermission() else {
            _ = CGRequestScreenCaptureAccess()
            return nil
        }
        let bounds = CGDisplayBounds(CGMainDisplayID())
        guard let image = CGWindowListCreateImage(bounds, .optionOnScreenOnly, kCGNullWindowID, [.bestResolution]) else {
            return nil
        }
        let scaled = downscale(image)
        let rep = NSBitmapImageRep(cgImage: scaled)
        guard let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8]) else { return nil }
        return Screenshot(
            pixelSize: CGSize(width: scaled.width, height: scaled.height),
            base64: data.base64EncodedString(),
            mediaType: "image/jpeg"
        )
    }

    private func downscale(_ image: CGImage) -> CGImage {
        let longest = max(image.width, image.height)
        guard longest > maxSide else { return image }
        let scale = Double(maxSide) / Double(longest)
        let width = Int(Double(image.width) * scale)
        let height = Int(Double(image.height) * scale)
        guard let ctx = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return image }
        ctx.interpolationQuality = .high
        ctx.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        return ctx.makeImage() ?? image
    }
}
