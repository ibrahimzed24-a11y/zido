import XCTest
import CoreGraphics
@testable import ZidoCore

final class RectParserTests: XCTestCase {
    func testParsesNormalizedTags() {
        let rects = RectParser.parse("Click it\n[RECT: 0.42, 0.08, 0.1, 0.04, Deploy button]")
        XCTAssertEqual(rects, [NormRect(x: 0.42, y: 0.08, w: 0.1, h: 0.04, label: "Deploy button")])
    }

    func testGridValuesAreScaled() {
        let r = RectParser.parse("[RECT: 500, 250, 100, 50, x]").first
        XCTAssertEqual(r?.x ?? 0, 0.5, accuracy: 1e-9)
        XCTAssertEqual(r?.h ?? 0, 0.05, accuracy: 1e-9)
    }

    func testClampsAndDropsEmpty() {
        XCTAssertEqual(RectParser.parse("[RECT: 0.9, 0.9, 0.5, 0.5, edge]").first?.w ?? 0, 0.1, accuracy: 1e-9)
        XCTAssertTrue(RectParser.parse("[RECT: 0.2, 0.2, 0, 0.1, none]").isEmpty)
    }

    func testToViewFlipsForAppKit() {
        let r = NormRect(x: 0.25, y: 0.1, w: 0.5, h: 0.2, label: "a")
        let v = RectParser.toView(r, size: CGSize(width: 1000, height: 500))
        XCTAssertEqual(v, CGRect(x: 250, y: 350, width: 500, height: 100))
        XCTAssertEqual(RectParser.toView(r, size: CGSize(width: 1000, height: 500), flipped: true).minY, 50)
    }

    func testClickPointIsCentre() {
        let p = RectParser.clickPoint(NormRect(x: 0.4, y: 0.4, w: 0.2, h: 0.2, label: "c"), displayBounds: CGRect(x: 0, y: 0, width: 1000, height: 800))
        XCTAssertEqual(p, CGPoint(x: 500, y: 400))
    }
}
