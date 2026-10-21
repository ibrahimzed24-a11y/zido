import SwiftUI

struct SettingsView: View {
    @ObservedObject var model: ZidoModel
    @State private var key = ""
    @State private var screen = Permissions.screenRecordingGranted
    @State private var accessibility = Permissions.accessibilityGranted

    var body: some View {
        Form {
            Section("Server") {
                TextField("Server URL", text: $model.serverURL)
            }
            Section("Link this Mac") {
                if let device = model.linkedDevice {
                    Label("Linked as \(device)", systemImage: "checkmark.seal.fill").foregroundStyle(.green)
                    Button("Unlink") { model.unlink() }
                } else {
                    SecureField("Device key from the dashboard", text: $key)
                    Button("Link") { Task { await model.link(key: key); key = "" } }.disabled(key.isEmpty)
                }
                if let status = model.status { Text(status).font(.footnote).foregroundStyle(.secondary) }
            }
            Section("Permissions") {
                permission("Screen Recording", granted: screen) { Permissions.requestScreenRecording() }
                permission("Accessibility", granted: accessibility) { Permissions.requestAccessibility() }
                Button("Check again") {
                    screen = Permissions.screenRecordingGranted
                    accessibility = Permissions.accessibilityGranted
                }
            }
        }
        .formStyle(.grouped)
        .frame(width: 460)
        .padding()
    }

    private func permission(_ title: String, granted: Bool, request: @escaping () -> Void) -> some View {
        HStack {
            Text(title)
            Spacer()
            if granted { Text("Allowed").foregroundStyle(.green) } else { Button("Allow…", action: request) }
        }
    }
}
