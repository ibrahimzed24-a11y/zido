#!/usr/bin/env bash
# Builds Zido.app with Info.plist so macOS shows the camera, microphone and screen recording prompts.
set -euo pipefail
cd "$(dirname "$0")/.."

swift build -c release
APP="Zido.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS"
cp .build/release/Zido "$APP/Contents/MacOS/Zido"
cp Info.plist "$APP/Contents/Info.plist"
codesign --force --sign - "$APP"
echo "Built $(pwd)/$APP"
