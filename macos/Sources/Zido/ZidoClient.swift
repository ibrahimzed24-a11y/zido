import Foundation
import ZidoCore

enum ZidoError: LocalizedError {
    case notLinked
    case server(String)

    var errorDescription: String? {
        switch self {
        case .notLinked: return "Link this Mac: create a device key in the Zido dashboard and paste it in Settings."
        case .server(let message): return message
        }
    }
}

struct ZidoClient {
    static let serverKey = "zidoServerURL"

    var baseURL: URL {
        let raw = UserDefaults.standard.string(forKey: Self.serverKey) ?? "http://localhost:3000"
        return URL(string: raw) ?? URL(string: "http://localhost:3000")!
    }

    func vision(_ request: VisionRequest) async throws -> VisionResponse {
        guard let key = Keychain.deviceKey(), !key.isEmpty else { throw ZidoError.notLinked }
        var urlRequest = URLRequest(url: baseURL.appendingPathComponent("api/zido/vision"))
        urlRequest.httpMethod = "POST"
        urlRequest.timeoutInterval = 90
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        urlRequest.httpBody = try JSONEncoder().encode(request)

        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        guard let http = response as? HTTPURLResponse else { throw ZidoError.server("No response from Zido") }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONDecoder().decode([String: String].self, from: data))?["error"]
            throw ZidoError.server(message ?? "Zido server error \(http.statusCode)")
        }
        return try JSONDecoder().decode(VisionResponse.self, from: data)
    }
}
