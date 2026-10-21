import AppKit
import CoreGraphics
import Foundation
import ZidoCore

@MainActor
final class ZidoModel: ObservableObject {
    @Published var expanded = false
    @Published var question = ""
    @Published var reply = ""
    @Published var rects: [ZidoRect] = []
    @Published var actions: [AgentAction] = []
    @Published var imageSize: CGSize = .zero
    @Published var busy = false
    @Published var status = "Grab → Say Hello → Get it Done"

    let capture = ScreenCapture()
    let client = ZidoClient()
    let memory: MemoryStore
    private var conversationId: String?

    init() {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        memory = MemoryStore(directory: support.appendingPathComponent("Zido", isDirectory: true))
        try? memory.ensureFiles()
    }

    /// Grab: capture the screen. Say Hello: send it with the question. Get it Done: show highlights and agent results.
    func ask() async {
        let text = question.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !busy else { return }
        busy = true
        defer { busy = false }

        guard let shot = capture.captureMainDisplay() else {
            status = "Allow Screen Recording for Zido in System Settings, then try again."
            return
        }
        status = "Looking…"
        do {
            let response = try await client.vision(VisionRequest(
                image: shot.base64,
                mediaType: shot.mediaType,
                question: text,
                conversationId: conversationId,
                screen: ScreenSize(width: shot.pixelSize.width, height: shot.pixelSize.height),
                allowAgents: true
            ))
            conversationId = response.conversationId
            reply = response.reply
            rects = response.rects
            actions = response.actions
            imageSize = shot.pixelSize
            question = ""
            status = response.actions.isEmpty ? "Done" : "\(response.actions.filter(\.ok).count) of \(response.actions.count) tasks done"
            try? memory.appendVolatile("Asked: \(text)")
        } catch {
            status = error.localizedDescription
        }
    }

    func clearHighlights() {
        rects = []
    }

    /// Clicks the first highlighted element with CGEvent, only when the user presses the button for it.
    func clickFirstHighlight() {
        guard let rect = rects.first else { return }
        guard InputController.isTrusted(prompt: true) else {
            status = "Allow Accessibility for Zido so it can click for you."
            return
        }
        let point = RectParser.centerInGlobal(rect, imageSize: imageSize, displayBounds: CGDisplayBounds(CGMainDisplayID()))
        expanded = false
        rects = []
        InputController.click(at: point)
    }
}
