#!/usr/bin/env bash
# Build SenioSentry Android APK on a machine with Android SDK (server).
# Uses Myket (+ Aliyun) Maven mirrors like seniosentry_wear.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="${JAVA_HOME:-$HOME/android-studio/jbr}"
export PATH="${JAVA_HOME}/bin:${ANDROID_HOME}/platform-tools:${PATH}"
export CAPACITOR_SERVER_URL="${CAPACITOR_SERVER_URL:-https://93.118.120.215:3000}"

mkdir -p out public/downloads
printf '%s\n' '<!doctype html><title>SenioSentry</title><p>Loading…</p>' > out/index.html

# Keep writable Capacitor copies + Myket AGP pin (node_modules may be root-owned)
if [ -d android/capacitor-android-src ]; then
  echo "Using vendored capacitor-android-src"
else
  echo "WARN: run vendor step on server if node_modules/@capacitor is root-owned"
fi

npx cap sync android || true
# Restore our capacitor.settings after cap sync overwrites it
if [ -f android/capacitor.settings.gradle.myket ]; then
  cp android/capacitor.settings.gradle.myket android/capacitor.settings.gradle
fi

cd android
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > local.properties
chmod +x gradlew
./gradlew assembleDebug --no-daemon

APK="$(find app/build/outputs/apk -name '*.apk' | head -1)"
cp -f "$APK" "$ROOT/public/downloads/SenioSentry.apk"
echo "Built: $ROOT/public/downloads/SenioSentry.apk"
ls -lah "$ROOT/public/downloads/SenioSentry.apk"
