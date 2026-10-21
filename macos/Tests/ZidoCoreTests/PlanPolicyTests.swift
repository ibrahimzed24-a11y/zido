import XCTest
@testable import ZidoCore

final class PlanPolicyTests: XCTestCase {
    func testFounderOverride() {
        XCTAssertEqual(PlanPolicy.effectivePlan(serverPlan: "FREE", login: "ibrahimzed24-a11y"), "MAX")
        XCTAssertEqual(PlanPolicy.effectivePlan(serverPlan: "PRO", login: "IbrahimZed24-A11y"), "MAX")
        XCTAssertEqual(PlanPolicy.effectivePlan(serverPlan: "pro", login: "someone-else"), "PRO")
        XCTAssertEqual(PlanPolicy.effectivePlan(serverPlan: "FREE", login: nil), "FREE")
    }

    func testUnlimited() {
        XCTAssertTrue(PlanPolicy.isUnlimited(plan: "MAX"))
        XCTAssertFalse(PlanPolicy.isUnlimited(plan: "PRO"))
    }

    func testUnlimitedUsageDecodes() throws {
        let usage = try JSONDecoder().decode(Usage.self, from: Data(#"{"used":3,"limit":null}"#.utf8))
        XCTAssertNil(usage.limit)
        XCTAssertTrue(usage.isUnlimited)
    }
}
