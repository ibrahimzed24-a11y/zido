import Foundation
import ZidoCore

enum ZidoClientError: LocalizedError {
    case server(String)
    case limitReached(String)
    case notLinked

    var errorDescription: String? {
        switch self {
        case .server(let message), .limitReached(let message): return message
        case .notLinked: return "This Mac is not linked yet."
        }
    }
}

struct ZidoClient {
    static let defaultServer = "https://zido-gamma.vercel.app"

    let baseURL: URL
    let deviceKey: String?

    func vision(_ body: VisionRequest) async throws -> VisionResponse {
        try await post("api/zido/vision", body: body, timeout: 70)
    }

    func heartbeat() async throws -> HeartbeatResponse {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "dev"
        return try await post("api/zido/device/heartbeat", body: ["appVersion": version], timeout: 15)
    }

    private func post<Body: Encodable, Out: Decodable>(_ path: String, body: Body, timeout: TimeInterval) async throws -> Out {
        guard let key = deviceKey else { throw ZidoClientError.notLinked }
        var req = URLRequest(url: baseURL.appendingPathComponent(path), timeoutInterval: timeout)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        req.httpBody = try JSONEncoder().encode(body)
        let (data, response) = try await URLSession.shared.data(for: req)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let message = (try? JSONDecoder().decode(APIErrorBody.self, from: data))?.error ?? "Server error \(status)"
            throw status == 429 ? ZidoClientError.limitReached(message) : ZidoClientError.server(message)
        }
        return try JSONDecoder().decode(Out.self, from: data)
    }
}
