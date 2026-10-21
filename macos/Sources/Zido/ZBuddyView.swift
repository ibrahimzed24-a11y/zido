import SwiftUI

/// The Z buddy: a slow pulse while idle, a bounce while Zido is thinking.
struct ZBuddyView: View {
    let state: ZidoModel.BuddyState
    var size: CGFloat = 22
    @State private var phase = false

    var body: some View {
        Text("Z")
            .font(.system(size: size * 0.55, weight: .bold, design: .rounded))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(Circle().fill(LinearGradient(colors: [Color(red: 0.65, green: 0.55, blue: 0.98), Color(red: 0.49, green: 0.23, blue: 0.93)],
                                                     startPoint: .topLeading, endPoint: .bottomTrailing)))
            .scaleEffect(state == .idle && phase ? 1.08 : 1)
            .offset(y: state == .thinking && phase ? -size * 0.25 : 0)
            .animation(state == .idle ? .easeInOut(duration: 1.2).repeatForever(autoreverses: true)
                                      : .interpolatingSpring(stiffness: 220, damping: 6).repeatForever(autoreverses: true),
                       value: phase)
            .onAppear { phase = true }
            .onChange(of: state) { _, _ in
                phase = false
                DispatchQueue.main.async { phase = true }
            }
    }
}
