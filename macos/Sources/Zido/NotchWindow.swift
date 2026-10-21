import AppKit
import SwiftUI
import ZidoCore

final class NotchPanel: NSPanel {
    override var canBecomeKey: Bool { true }
}

/// The Notch UI: a borderless panel pinned to the top centre of the screen, over the hardware notch.
@MainActor
final class NotchWindowController {
    let panel: NotchPanel

    init(model: ZidoModel) {
        let size = NSSize(width: 440, height: 300)
        panel = NotchPanel(
            contentRect: NSRect(origin: .zero, size: size),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.level = NSWindow.Level(rawValue: NSWindow.Level.statusBar.rawValue + 1)
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        panel.sharingType = .none
        panel.isMovable = false
        panel.contentView = NSHostingView(rootView: NotchView().environmentObject(model))
        position()
    }

    func position() {
        guard let screen = NSScreen.main else { return }
        let frame = screen.frame
        let size = panel.frame.size
        panel.setFrameOrigin(NSPoint(x: frame.midX - size.width / 2, y: frame.maxY - size.height))
    }

    func show() {
        panel.orderFrontRegardless()
    }
}

struct NotchShape: Shape {
    var radius: CGFloat = 18

    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY - radius))
        p.addQuadCurve(to: CGPoint(x: r.maxX - radius, y: r.maxY), control: CGPoint(x: r.maxX, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX + radius, y: r.maxY))
        p.addQuadCurve(to: CGPoint(x: r.minX, y: r.maxY - radius), control: CGPoint(x: r.minX, y: r.maxY))
        p.closeSubpath()
        return p
    }
}

struct NotchView: View {
    @EnvironmentObject var model: ZidoModel

    var body: some View {
        VStack(spacing: 0) {
            content
                .frame(width: model.expanded ? 420 : 190, height: model.expanded ? 280 : 34, alignment: .top)
                .background(NotchShape().fill(Color.black))
                .animation(.spring(response: 0.35, dampingFraction: 0.8), value: model.expanded)
                .onHover { hovering in
                    if hovering { model.expanded = true }
                }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
    }

    @ViewBuilder
    private var content: some View {
        if model.expanded {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Circle().fill(model.busy ? Color.orange : Color.purple).frame(width: 8, height: 8)
                    Text("Zido").font(.headline).foregroundColor(.white)
                    Spacer()
                    Button {
                        NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
                    } label: {
                        Image(systemName: "gearshape")
                    }
                    .buttonStyle(.plain)
                    .foregroundColor(.gray)
                    Button {
                        model.expanded = false
                    } label: {
                        Image(systemName: "chevron.up")
                    }
                    .buttonStyle(.plain)
                    .foregroundColor(.gray)
                }
                ScrollView {
                    Text(model.reply.isEmpty ? "Hi, I'm Zido. Ask me anything about what's on your screen." : model.reply)
                        .font(.callout)
                        .foregroundColor(.white.opacity(0.9))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .textSelection(.enabled)
                }
                if !model.rects.isEmpty {
                    HStack {
                        Button("Click \"\(model.rects[0].label)\" for me") { model.clickFirstHighlight() }
                        Button("Clear highlights") { model.clearHighlights() }
                    }
                    .font(.caption)
                }
                HStack {
                    TextField("Say hello to Zido…", text: $model.question)
                        .textFieldStyle(.plain)
                        .padding(8)
                        .background(Color.white.opacity(0.08))
                        .cornerRadius(8)
                        .foregroundColor(.white)
                        .onSubmit { Task { await model.ask() } }
                    Button {
                        Task { await model.ask() }
                    } label: {
                        Image(systemName: model.busy ? "hourglass" : "arrow.up.circle.fill").font(.title2)
                    }
                    .buttonStyle(.plain)
                    .foregroundColor(.purple)
                    .disabled(model.busy)
                }
                Text(model.status).font(.caption2).foregroundColor(.gray).lineLimit(2)
            }
            .padding(.horizontal, 16)
            .padding(.top, 34)
            .padding(.bottom, 12)
        } else {
            HStack(spacing: 6) {
                Image(systemName: "sparkles").foregroundColor(.purple)
                Text("Zido").font(.caption).bold().foregroundColor(.white)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}
