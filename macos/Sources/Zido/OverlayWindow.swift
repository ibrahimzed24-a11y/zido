import AppKit
import SwiftUI
import ZidoCore

/// Full-screen, click-through overlay at the .screenSaver level that draws Zido's [RECT] highlights.
@MainActor
final class OverlayWindowController {
    let window: NSWindow

    init(model: ZidoModel) {
        let frame = NSScreen.main?.frame ?? .zero
        window = NSWindow(contentRect: frame, styleMask: [.borderless], backing: .buffered, defer: false)
        window.level = .screenSaver
        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = false
        window.ignoresMouseEvents = true
        window.sharingType = .none
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        window.contentView = NSHostingView(rootView: OverlayView().environmentObject(model))
        window.setFrame(frame, display: true)
        window.orderFrontRegardless()
    }
}

struct OverlayView: View {
    @EnvironmentObject var model: ZidoModel

    var body: some View {
        GeometryReader { geo in
            ForEach(Array(model.rects.enumerated()), id: \.offset) { _, rect in
                let frame = RectParser.toView(rect, imageSize: model.imageSize, viewSize: geo.size)
                ZStack(alignment: .topLeading) {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.purple, lineWidth: 3)
                        .background(RoundedRectangle(cornerRadius: 8).fill(Color.purple.opacity(0.12)))
                        .shadow(color: .purple.opacity(0.6), radius: 8)
                        .frame(width: frame.width, height: frame.height)
                    Text(rect.label)
                        .font(.caption.bold())
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(Color.purple))
                        .offset(y: -24)
                }
                .position(x: frame.midX, y: frame.midY)
            }
        }
        .ignoresSafeArea()
    }
}
