import AppKit
import SwiftUI

@main
struct ZidoApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        Settings {
            SettingsView()
        }
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private var model: ZidoModel?
    private var notch: NotchWindowController?
    private var overlay: OverlayWindowController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        let model = ZidoModel()
        self.model = model
        overlay = OverlayWindowController(model: model)
        notch = NotchWindowController(model: model)
        notch?.show()
    }
}
