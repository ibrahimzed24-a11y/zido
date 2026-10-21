import SwiftUI

/// First-run flow: shows the real status of each permission and asks for it. Re-checks every two seconds.
struct PermissionsView: View {
    @State private var screen = Permissions.screenRecordingGranted
    @State private var accessibility = Permissions.accessibilityGranted
    private let timer = Timer.publish(every: 2, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 12) {
                ZBuddyView(state: .idle, size: 40)
                Text("Zido needs two permissions").font(.title2.weight(.semibold))
            }
            row("Screen Recording", "So Zido can see the screen when you ask a question.", granted: screen) {
                Permissions.requestScreenRecording()
            }
            row("Accessibility", "Only for clicks you confirm. Zido never clicks on its own.", granted: accessibility) {
                Permissions.requestAccessibility()
            }
            Text("After allowing Screen Recording, macOS may ask you to quit and reopen Zido.")
                .font(.footnote).foregroundStyle(.secondary)
        }
        .padding(24)
        .frame(width: 460)
        .onReceive(timer) { _ in
            screen = Permissions.screenRecordingGranted
            accessibility = Permissions.accessibilityGranted
        }
    }

    private func row(_ title: String, _ detail: String, granted: Bool, request: @escaping () -> Void) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)
                Text(detail).font(.subheadline).foregroundStyle(.secondary)
            }
            Spacer()
            if granted {
                Label("Allowed", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
            } else {
                Button("Allow…", action: request)
            }
        }
    }
}
