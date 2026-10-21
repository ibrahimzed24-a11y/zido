import AppKit
import ZidoCore

/// A click-through, transparent window at .screenSaver level that draws Zido's highlights over the main display.
final class OverlayWindow: NSWindow {
    init(screen: NSScreen) {
        super.init(contentRect: screen.frame, styleMask: .borderless, backing: .buffered, defer: false)
        level = .screenSaver
        isOpaque = false
        backgroundColor = .clear
        hasShadow = false
        ignoresMouseEvents = true
        sharingType = .none
        collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary, .ignoresCycle]
        contentView = OverlayView(frame: NSRect(origin: .zero, size: screen.frame.size))
    }
}

final class OverlayView: NSView {
    var rects: [NormRect] = [] { didSet { needsDisplay = true } }

    override func draw(_ dirtyRect: NSRect) {
        let purple = NSColor(calibratedRed: 0.55, green: 0.36, blue: 0.96, alpha: 1)
        for r in rects {
            let frame = RectParser.toView(r, size: bounds.size).insetBy(dx: -4, dy: -4)
            let path = NSBezierPath(roundedRect: frame, xRadius: 8, yRadius: 8)
            purple.withAlphaComponent(0.12).setFill()
            path.fill()
            purple.setStroke()
            path.lineWidth = 3
            path.stroke()

            let label = NSAttributedString(string: " \(r.label) ", attributes: [
                .font: NSFont.systemFont(ofSize: 13, weight: .semibold),
                .foregroundColor: NSColor.white,
                .backgroundColor: purple,
            ])
            let size = label.size()
            label.draw(at: NSPoint(x: frame.minX, y: min(frame.maxY + 4, bounds.height - size.height)))
        }
    }
}

@MainActor
final class OverlayController {
    private var window: OverlayWindow?
    private var clearTask: Task<Void, Never>?

    func show(_ rects: [NormRect], seconds: UInt64 = 10) {
        guard let screen = NSScreen.main else { return }
        if window == nil || window?.frame != screen.frame { window = OverlayWindow(screen: screen) }
        (window?.contentView as? OverlayView)?.rects = rects
        if rects.isEmpty { window?.orderOut(nil); return }
        window?.orderFrontRegardless()
        clearTask?.cancel()
        clearTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: seconds * 1_000_000_000)
            if !Task.isCancelled { self?.show([]) }
        }
    }
}
