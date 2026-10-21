import XCTest
import CoreGraphics
@testable import ZidoCore

final class ClickGuardTests: XCTestCase {
    let screen = [CGRect(x: 0, y: 0, width: 1440, height: 900)]

    func testRules() {
        var guardrail = ClickGuard(minInterval: 1)
        let p = CGPoint(x: 100, y: 100)
        XCTAssertEqual(guardrail.check(point: p, displays: screen, trusted: false, confirmed: true), .notTrusted)
        XCTAssertEqual(guardrail.check(point: CGPoint(x: 5000, y: 5), displays: screen, trusted: true, confirmed: true), .outOfBounds)
        XCTAssertEqual(guardrail.check(point: p, displays: screen, trusted: true, confirmed: false), .notConfirmed)
        let now = Date()
        XCTAssertEqual(guardrail.check(point: p, displays: screen, trusted: true, confirmed: true, now: now), .allowed)
        guardrail.record(now)
        XCTAssertEqual(guardrail.check(point: p, displays: screen, trusted: true, confirmed: true, now: now.addingTimeInterval(0.5)), .tooSoon)
    }
}
