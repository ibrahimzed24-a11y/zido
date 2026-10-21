import CoreGraphics
import XCTest
@testable import ZidoCore

final class RectParserTests: XCTestCase {
    func testParsesRectAndCleansText() {
        let result = RectParser.parse("Click here\n[RECT: 100, 50, 80, 20, Save]")
        XCTAssertEqual(result.clean, "Click here")
        XCTAssertEqual(result.rects, [ZidoRect(x: 100, y: 50, w: 80, h: 20, label: "Save")])
    }

    func testIgnoresMalformedTags() {
        XCTAssertTrue(RectParser.parse("[RECT: a, b]").rects.isEmpty)
    }

    func testMapsToRetinaView() {
        let r = ZidoRect(x: 200, y: 100, w: 40, h: 20, label: "x")
        let frame = RectParser.toView(r, imageSize: CGSize(width: 2880, height: 1800), viewSize: CGSize(width: 1440, height: 900))
        XCTAssertEqual(frame, CGRect(x: 100, y: 50, width: 20, height: 10))
    }

    func testCenterInGlobalCoordinates() {
        let r = ZidoRect(x: 0, y: 0, w: 100, h: 100, label: "x")
        let p = RectParser.centerInGlobal(r, imageSize: CGSize(width: 1000, height: 1000), displayBounds: CGRect(x: 10, y: 0, width: 500, height: 500))
        XCTAssertEqual(p, CGPoint(x: 35, y: 25))
    }
}
