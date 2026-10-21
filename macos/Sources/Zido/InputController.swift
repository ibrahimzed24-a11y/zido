import AppKit
import CoreGraphics
import ZidoCore

/// The controlled foundation for synthetic input. Every click needs Accessibility trust, a point on a display,
/// a pause since the last click, and the user's explicit confirmation. Nothing here runs on its own.
@MainActor
enum InputController {
    private static var guardrail = ClickGuard(minInterval: 1.0)

    static func displayBounds() -> [CGRect] {
        var count: UInt32 = 0
        CGGetActiveDisplayList(0, nil, &count)
        var ids = [CGDirectDisplayID](repeating: 0, count: Int(count))
        CGGetActiveDisplayList(count, &ids, &count)
        return ids.map { CGDisplayBounds($0) }
    }

    /// Asks the user, then clicks at `point` (global display coordinates, top-left origin).
    @discardableResult
    static func confirmAndClick(at point: CGPoint, label: String) -> ClickGuard.Verdict {
        let precheck = guardrail.check(point: point, displays: displayBounds(), trusted: Permissions.accessibilityGranted, confirmed: true)
        guard precheck == .allowed else { return precheck }

        let alert = NSAlert()
        alert.messageText = "Let Zido click “\(label)”?"
        alert.informativeText = "Zido will click once at the highlighted spot."
        alert.addButton(withTitle: "Click")
        alert.addButton(withTitle: "Cancel")
        let confirmed = alert.runModal() == .alertFirstButtonReturn

        let verdict = guardrail.check(point: point, displays: displayBounds(), trusted: Permissions.accessibilityGranted, confirmed: confirmed)
        guard verdict == .allowed else { return verdict }
        post(at: point)
        guardrail.record()
        return .allowed
    }

    private static func post(at point: CGPoint) {
        let source = CGEventSource(stateID: .hidSystemState)
        CGEvent(mouseEventSource: source, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)
        CGEvent(mouseEventSource: source, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)
        CGEvent(mouseEventSource: source, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)
    }
}
