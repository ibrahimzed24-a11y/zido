import XCTest
@testable import ZidoCore

final class MemoryStoreTests: XCTestCase {
    func testVolatileKeepsNewestLines() {
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        let store = MemoryStore(directory: dir)
        for i in 0..<(MemoryStore.volatileMaxLines + 5) { store.appendVolatile("entry \(i)") }
        let lines = store.read(MemoryStore.volatileFile).split(separator: "\n")
        XCTAssertEqual(lines.count, MemoryStore.volatileMaxLines)
        XCTAssertTrue(lines.last?.hasSuffix("entry \(MemoryStore.volatileMaxLines + 4)") ?? false)
    }

    func testProfileRoundTrip() {
        let store = MemoryStore(directory: FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString))
        store.write(MemoryStore.profileFile, "- Likes Swift\n")
        XCTAssertEqual(store.read(MemoryStore.profileFile), "- Likes Swift\n")
    }
}
