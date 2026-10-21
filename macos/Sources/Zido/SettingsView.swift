import SwiftUI

struct SettingsView: View {
    @AppStorage(ZidoClient.serverKey) private var serverURL = "http://localhost:3000"
    @State private var deviceKey = ""
    @State private var saved = false

    var body: some View {
        Form {
            Section("Account") {
                TextField("Zido server", text: $serverURL)
                SecureField("Device key", text: $deviceKey)
                Button(saved ? "Saved" : "Save device key") {
                    Keychain.save(deviceKey: deviceKey.trimmingCharacters(in: .whitespacesAndNewlines))
                    deviceKey = ""
                    saved = true
                }
                .disabled(deviceKey.isEmpty)
            }
            Section("Permissions") {
                Button("Screen Recording") { Permissions.requestScreenRecording() }
                Button("Accessibility (click for me)") { _ = InputController.isTrusted(prompt: true) }
                Button("Microphone") { Permissions.requestMicrophone() }
                Button("Camera") { Permissions.requestCamera() }
            }
        }
        .padding(20)
        .frame(width: 440)
    }
}
