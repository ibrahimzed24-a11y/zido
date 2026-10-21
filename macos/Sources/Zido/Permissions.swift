import AVFoundation
import CoreGraphics

/// Camera and microphone use the NSCameraUsageDescription and NSMicrophoneUsageDescription strings in Info.plist.
enum Permissions {
    static func requestCamera() {
        AVCaptureDevice.requestAccess(for: .video) { _ in }
    }

    static func requestMicrophone() {
        AVCaptureDevice.requestAccess(for: .audio) { _ in }
    }

    static func requestScreenRecording() {
        _ = CGRequestScreenCaptureAccess()
    }
}
