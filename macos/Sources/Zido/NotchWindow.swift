import AppKit
import SwiftUI

/// A borderless panel pinned to the top centre of the main screen, just under the notch.
final class NotchPanel: NSPanel {
    static let collapsed = NSSize(width: 220, height: 34)
    static let expanded = NSSize(width: 440, height: 434)

    private let model: ZidoModel

    @MainActor
    init(model: ZidoModel) {
        self.model = model
        super.init(contentRect: NSRect(origin: .zero, size: Self.collapsed),
                   styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
        level = NSWindow.Level(rawValue: NSWindow.Level.statusBar.rawValue + 1)
        isOpaque = false
        backgroundColor = .clear
        hasShadow = false
        sharingType = .none
        isMovable = false
        collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        contentView = NSHostingView(rootView: NotchView(model: model, onResize: { [weak self] open in self?.resize(open) }))
        resize(false)
    }

    override var canBecomeKey: Bool { true }

    func resize(_ open: Bool) {
        guard let screen = NSScreen.main else { return }
        let size = open ? Self.expanded : Self.collapsed
        let frame = NSRect(x: screen.frame.midX - size.width / 2, y: screen.frame.maxY - size.height, width: size.width, height: size.height)
        setFrame(frame, display: true, animate: true)
        if open { makeKey() }
    }
}

/// NSVisualEffectView for the translucent chat background.
struct VisualEffect: NSViewRepresentable {
    func makeNSView(context: Context) -> NSVisualEffectView {
        let v = NSVisualEffectView()
        v.material = .hudWindow
        v.blendingMode = .behindWindow
        v.state = .active
        return v
    }
    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {}
}

struct NotchView: View {
    @ObservedObject var model: ZidoModel
    let onResize: (Bool) -> Void

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 8) {
                ZBuddyView(state: model.buddy)
                Text(model.buddy == .thinking ? "Thinking…" : "Zido").font(.caption.weight(.medium)).foregroundStyle(.white)
                Spacer()
                if model.expanded {
                    Button { toggle() } label: { Image(systemName: "chevron.up") }.buttonStyle(.plain).foregroundStyle(.white)
                }
            }
            .padding(.horizontal, 14)
            .frame(height: NotchPanel.collapsed.height)
            .contentShape(Rectangle())
            .onTapGesture { if !model.expanded { toggle() } }

            if model.expanded { ZidoMainView() }
        }
        .background(model.expanded ? AnyView(VisualEffect()) : AnyView(Color.black))
        .clipShape(UnevenRoundedRectangle(bottomLeadingRadius: 18, bottomTrailingRadius: 18))
    }

    private func toggle() {
        model.expanded.toggle()
        onResize(model.expanded)
    }
}

struct ChatView: View {
    @ObservedObject var model: ZidoModel

    var body: some View {
        VStack(spacing: 8) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 8) {
                        if model.messages.isEmpty {
                            Text("Ask me anything about what's on your screen.").foregroundStyle(.secondary).font(.callout)
                        }
                        ForEach(model.messages) { m in
                            Text(m.text)
                                .font(.callout)
                                .textSelection(.enabled)
                                .padding(8)
                                .background(RoundedRectangle(cornerRadius: 10).fill(m.fromUser ? Color.purple.opacity(0.35) : Color.white.opacity(0.08)))
                                .frame(maxWidth: .infinity, alignment: m.fromUser ? .trailing : .leading)
                                .id(m.id)
                        }
                    }
                    .padding(.horizontal, 12)
                }
                .onChange(of: model.messages) { _, messages in
                    if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                }
            }
            HStack {
                TextField("Say hello…", text: $model.draft)
                    .textFieldStyle(.roundedBorder)
                    .onSubmit { Task { await model.ask() } }
                Button { Task { await model.ask() } } label: { Image(systemName: "arrow.up.circle.fill").font(.title2) }
                    .buttonStyle(.plain)
                    .disabled(model.buddy == .thinking)
            }
            .padding(12)
        }
    }
}
