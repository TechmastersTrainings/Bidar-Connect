#!/usr/bin/env bash
set -e

echo "Building Bidar Connect Android APK (Target SDK 34 / Android 14)..."

JAVA_HOME="/opt/homebrew/opt/openjdk@17"
ANDROID_TOOLS="/opt/homebrew/share/android-commandlinetools/build-tools/35.0.0"
ANDROID_JAR="/opt/homebrew/share/android-commandlinetools/platforms/android-35/android.jar"
BUILD_DIR="/tmp/bidar_apk_build"

export PATH="$JAVA_HOME/bin:$PATH"

# Compile resources
"$ANDROID_TOOLS/aapt2" compile --dir "$BUILD_DIR/res" -o "$BUILD_DIR/compiled/res.zip"

# Link APK with Target SDK 34
"$ANDROID_TOOLS/aapt2" link -I "$ANDROID_JAR" -A "$BUILD_DIR/assets" --manifest "$BUILD_DIR/AndroidManifest.xml" -o "$BUILD_DIR/app-unaligned.apk" --java "$BUILD_DIR/src" "$BUILD_DIR/compiled/res.zip"

# Compile Java sources
"$JAVA_HOME/bin/javac" -d "$BUILD_DIR/bin" -cp "$ANDROID_JAR" "$BUILD_DIR/src/com/bidarconnect/app/"*.java

# Convert to Dalvik dex
"$ANDROID_TOOLS/d8" "$BUILD_DIR/bin/com/bidarconnect/app/"*.class --output "$BUILD_DIR/" --lib "$ANDROID_JAR"

# Add classes.dex into APK
(cd "$BUILD_DIR" && zip -u app-unaligned.apk classes.dex)

# Align APK
"$ANDROID_TOOLS/zipalign" -v -f -p 4 "$BUILD_DIR/app-unaligned.apk" "$BUILD_DIR/app-aligned.apk"

# Sign APK with v2 & v3 schemes
"$ANDROID_TOOLS/apksigner" sign --ks "$BUILD_DIR/bidar.keystore" --ks-key-alias bidarconnect --ks-pass pass:bidarconnect123 --key-pass pass:bidarconnect123 --out "$BUILD_DIR/bidar-connect.apk" "$BUILD_DIR/app-aligned.apk"

# Copy outputs
cp "$BUILD_DIR/bidar-connect.apk" "bidar-connect.apk"
cp "$BUILD_DIR/bidar-connect.apk" "apps/mobile/bidar-connect.apk"
mkdir -p "apps/public-web/public"
cp "$BUILD_DIR/bidar-connect.apk" "apps/public-web/public/bidar-connect.apk"
mkdir -p "/tmp/bidar_apps/public-web/public"
cp "$BUILD_DIR/bidar-connect.apk" "/tmp/bidar_apps/public-web/public/bidar-connect.apk"

echo "Build complete: bidar-connect.apk"
