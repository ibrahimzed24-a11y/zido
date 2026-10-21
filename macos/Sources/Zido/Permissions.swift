import AppKit
import ApplicationServices
import CoreGraphics

/// Screen Recording and Accessibility. These read the real state; macOS decides, the user grants.
enum Permissions {
    static var screenRecordingGranted: Bool { CGPreflightScreenCaptureAccess() }
    static var accessibilityGranted: Bool { AXIsProcessTrusted() }

    /// Shows the system prompt once; afterwards macOS only allows changes in System Settings.
    static func requestScreenRecording() {
        if !CGRequestScreenCaptureAccess() { openSettings("Privacy_ScreenCapture") }
    }

    static func requestAccessibility() {
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
        if !AXIsProcessTrustedWithOptions(options) { openSettings("Privacy_Accessibility") }
    }

    static func openSettings(_ pane: String) {
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?\(pane)") {
            NSWorkspace.shared.open(url)
        }
    }
}
