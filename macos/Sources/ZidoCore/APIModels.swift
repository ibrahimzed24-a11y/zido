import Foundation

public struct ScreenSize: Codable, Equatable {
    public var width: Double
    public var height: Double

    public init(width: Double, height: Double) {
        self.width = width
        self.height = height
    }
}

/// Body of POST /api/zido/vision.
public struct VisionRequest: Codable {
    public var image: String
    public var mediaType: String
    public var question: String
    public var conversationId: String?
    public var screen: ScreenSize
    public var allowAgents: Bool

    public init(image: String, mediaType: String, question: String, conversationId: String?, screen: ScreenSize, allowAgents: Bool) {
        self.image = image
        self.mediaType = mediaType
        self.question = question
        self.conversationId = conversationId
        self.screen = screen
        self.allowAgents = allowAgents
    }
}

public struct AgentAction: Codable, Equatable {
    public var tool: String
    public var ok: Bool
    public var summary: String
}

public struct VisionResponse: Codable {
    public var conversationId: String
    public var reply: String
    public var rects: [ZidoRect]
    public var actions: [AgentAction]
}
