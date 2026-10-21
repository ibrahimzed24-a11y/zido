import SwiftUI
import AppKit
import ZidoCore

@main
struct ZidoApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        Settings {
            SettingsView(model: appDelegate.model)
        }
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    let model = ZidoEngine.shared.model
    private var notch: NotchPanel?
    private var onboarding: NSWindow?
    private var heartbeat: Timer?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        notch = NotchPanel(model: model)
        notch?.orderFrontRegardless()
        model.overlay = OverlayController()

        if !Permissions.screenRecordingGranted || !Permissions.accessibilityGranted {
            showOnboarding()
        }
        heartbeat = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            Task { @MainActor in await self?.model.sendHeartbeat() }
        }
        Task { await model.sendHeartbeat() }
    }

    func showOnboarding() {
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 460, height: 360),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        window.title = "Welcome to Zido"
        window.isReleasedWhenClosed = false
        window.contentView = NSHostingView(rootView: PermissionsView())
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        onboarding = window
    }
}

// MARK: - Main view

class ZidoViewModel: ObservableObject {
    enum ViewState { case chat, settings }

    @Published var currentView: ViewState = .chat

    func toggleSettings() {
        withAnimation(.easeInOut(duration: 0.2)) {
            currentView = currentView == .chat ? .settings : .chat
        }
    }
}

struct ZidoMainView: View {
    // Use @StateObject to ensure the state persists and triggers redraws
    @StateObject var viewModel = ZidoViewModel()

    var body: some View {
        VStack {
            if viewModel.currentView == .chat {
                ZidoChatView(viewModel: viewModel)
            } else {
                ZidoSettingsView(viewModel: viewModel)
            }
        }
        .frame(width: 300, height: 400)
        .background(Color(NSColor.windowBackgroundColor))
    }
}

struct ZidoChatView: View {
    @ObservedObject var viewModel: ZidoViewModel
    @ObservedObject var engine = ZidoEngine.shared
    @State private var inputText: String = ""

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.purple)
                Text("Zido")
                    .font(.headline)
                Spacer()
                Button(action: { viewModel.toggleSettings() }) {
                    Image(systemName: "gearshape")
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .help("Settings")
            }
            .padding()

            ChatView(model: engine.model)
        }
    }
}

struct ZidoSettingsView: View {
    @ObservedObject var viewModel: ZidoViewModel
    @ObservedObject var engine = ZidoEngine.shared
    @ObservedObject var model = ZidoEngine.shared.model
    @State private var keyInput: String = ""
    @State private var saved = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Button(action: { viewModel.toggleSettings() }) {
                    Image(systemName: "chevron.left")
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                Text("Settings")
                    .font(.headline)
                Spacer()
            }

            Text("Device Key")
                .font(.subheadline.weight(.medium))
            SecureField("Paste the key from the dashboard", text: $keyInput)
                .textFieldStyle(.roundedBorder)
            HStack {
                Button("Save") {
                    engine.saveDeviceKey(keyInput)
                    saved = true
                }
                .disabled(keyInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                if saved {
                    Text("Saved").font(.footnote).foregroundStyle(.green)
                }
            }

            if let device = model.linkedDevice {
                Label("Linked as \(device)", systemImage: "checkmark.seal.fill")
                    .font(.footnote)
                    .foregroundStyle(.green)
            }
            if let plan = model.plan {
                Label(model.unlimited ? "\(plan.capitalized) plan · Unlimited usage" : "\(plan.capitalized) plan",
                      systemImage: model.unlimited ? "infinity" : "person.crop.circle")
                    .font(.footnote)
            }
            if let status = model.status {
                Text(status).font(.footnote).foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
        .onAppear { keyInput = engine.deviceKey }
    }
}
