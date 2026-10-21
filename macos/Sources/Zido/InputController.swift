import AppKit
import ApplicationServices
import CoreGraphics

/// Synthesised input with CGEvent. Requires the Accessibility permission.
enum InputController {
    static func isTrusted(prompt: Bool) -> Bool {
        let options = ["AXTrustedCheckOptionPrompt": prompt] as CFDictionary
        return AXIsProcessTrustedWithOptions(options)
    }

    /// Moves the pointer to `point` (global, top-left origin) and left-clicks.
    static func click(at point: CGPoint) {
        let source = CGEventSource(stateID: .hidSystemState)
        for type in [CGEventType.mouseMoved, .leftMouseDown, .leftMouseUp] {
            CGEvent(mouseEventSource: source, mouseType: type, mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)
        }
    }

    /// Types text into the focused field.
    static func type(_ text: String) {
        let source = CGEventSource(stateID: .hidSystemState)
        for unit in text.utf16 {
            var character = unit
            for keyDown in [true, false] {
                let event = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: keyDown)
                event?.keyboardSetUnicodeString(stringLength: 1, unicodeString: &character)
                event?.post(tap: .cghidEventTap)
            }
        }
    }
}
