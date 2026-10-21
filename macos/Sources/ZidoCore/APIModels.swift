import Foundation

/// A highlight from /api/zido/vision. x, y, w, h are fractions (0-1) of the screenshot, origin top-left.
public struct NormRect: Codable, Equatable, Sendable {
    public var x: Double
    public var y: Double
    public var w: Double
    public var h: Double
    public var label: String

    public init(x: Double, y: Double, w: Double, h: Double, label: String) {
        self.x = x; self.y = y; self.w = w; self.h = h; self.label = label
    }
}

public struct ScreenSize: Codable, Equatable, Sendable {
    public var width: Int
    public var height: Int
    public init(width: Int, height: Int) { self.width = width; self.height = height }
}

public struct VisionRequest: Codable, Sendable {
    public var image: String
    public var mediaType: String
    public var question: String
    public var conversationId: String?
    public var screen: ScreenSize?

    public init(image: String, mediaType: String = "image/jpeg", question: String, conversationId: String? = nil, screen: ScreenSize? = nil) {
        self.image = image; self.mediaType = mediaType; self.question = question
        self.conversationId = conversationId; self.screen = screen
    }
}

public struct Usage: Codable, Equatable, Sendable {
    public var used: Int
    /// nil when the plan is unlimited (Max).
    public var limit: Int?
    public var isUnlimited: Bool { limit == nil }
}

public struct VisionResponse: Codable, Sendable {
    public var conversationId: String
    public var reply: String
    public var rects: [NormRect]
    public var rectTags: [String]?
    public var usage: Usage?
}

public struct HeartbeatResponse: Codable, Sendable {
    public struct User: Codable, Sendable {
        public var id: String?
        public var name: String?
        /// GitHub login
        public var login: String?
        public var plan: String
        public var unlimited: Bool?
    }
    public struct Device: Codable, Sendable { public var id: String; public var name: String }
    public var ok: Bool
    public var user: User
    public var device: Device
}

public struct APIErrorBody: Codable, Sendable {
    public var error: String
    public var missing: [String]?
}
