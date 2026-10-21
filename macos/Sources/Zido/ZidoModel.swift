import SwiftUI
import AppKit
import ZidoCore

struct ChatMessage: Identifiable, Equatable {
    let id = UUID()
    let fromUser: Bool
    let text: String
}

@MainActor
final class ZidoModel: ObservableObject {
    enum BuddyState { case idle, thinking }

    @Published var expanded = false
    @Published var buddy: BuddyState = .idle
    @Published var messages: [ChatMessage] = []
    @Published var draft = ""
    @Published var status: String?
    @Published var linkedDevice: String?

    @AppStorage("serverURL") var serverURL = ZidoClient.defaultServer

    var overlay: OverlayController?
    private var conversationId: String?
    private let memory = MemoryStore(directory: MemoryStore.defaultDirectory())

    var client: ZidoClient { ZidoClient(baseURL: URL(string: serverURL) ?? URL(string: ZidoClient.defaultServer)!, deviceKey: Keychain.loadDeviceKey()) }

    func ask() async {
        let question = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !question.isEmpty, buddy == .idle else { return }
        draft = ""
        messages.append(ChatMessage(fromUser: true, text: question))

        guard Keychain.loadDeviceKey() != nil else {
            messages.append(ChatMessage(fromUser: false, text: "Link this Mac first: create a device key on the dashboard and paste it in Settings."))
            return
        }
        guard Permissions.screenRecordingGranted, let shot = ScreenCapture.captureMainDisplay() else {
            messages.append(ChatMessage(fromUser: false, text: "I need Screen Recording permission to see your screen. Open Settings to allow it."))
            return
        }

        buddy = .thinking
        defer { buddy = .idle }
        do {
            let res = try await client.vision(VisionRequest(image: shot.base64, question: question, conversationId: conversationId, screen: shot.size))
            conversationId = res.conversationId
            messages.append(ChatMessage(fromUser: false, text: res.reply))
            overlay?.show(res.rects)
            memory.appendVolatile("Asked: \(question)")
        } catch {
            messages.append(ChatMessage(fromUser: false, text: error.localizedDescription))
        }
    }

    /// Links this Mac: stores the key in the Keychain, then proves it with a heartbeat.
    func link(key: String) async {
        let trimmed = key.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.hasPrefix("zido_") else { status = "That does not look like a Zido device key."; return }
        Keychain.saveDeviceKey(trimmed)
        await sendHeartbeat()
        if linkedDevice == nil { Keychain.deleteDeviceKey() }
    }

    func unlink() {
        Keychain.deleteDeviceKey()
        linkedDevice = nil
        status = "This Mac is unlinked."
    }

    func sendHeartbeat() async {
        guard Keychain.loadDeviceKey() != nil else { linkedDevice = nil; return }
        do {
            let hb = try await client.heartbeat()
            linkedDevice = "\(hb.device.name) · \(hb.user.plan.capitalized)"
            status = nil
        } catch {
            linkedDevice = nil
            status = error.localizedDescription
        }
    }
}
