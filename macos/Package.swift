// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Zido",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "Zido", targets: ["Zido"]),
    ],
    targets: [
        .target(name: "ZidoCore"),
        .executableTarget(name: "Zido", dependencies: ["ZidoCore"]),
        .testTarget(name: "ZidoCoreTests", dependencies: ["ZidoCore"]),
    ]
)
