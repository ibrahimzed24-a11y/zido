import XCTest
@testable import ZidoCore

final class MemoryStoreTests: XCTestCase {
    func testCreatesFilesAndCapsVolatile() throws {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: dir) }
        let store = MemoryStore(directory: dir)
        try store.ensureFiles()
        XCTAssertTrue(store.read(store.profileURL).hasPrefix("# PROFILE.md"))

        for i in 0..<5 { try store.appendVolatile("entry \(i)", maxLines: 3) }
        let lines = store.read(store.volatileURL).components(separatedBy: "\n").filter { $0.hasPrefix("- ") }
        XCTAssertEqual(lines.count, 3)
        XCTAssertTrue(lines.last?.hasSuffix("entry 4") ?? false)
    }
}
