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
    let model = ZidoModel()
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
