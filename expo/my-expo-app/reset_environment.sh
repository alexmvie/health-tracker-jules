#!/bin/bash

# Stop any running processes
echo "Stopping any running processes..."
pkill -f "expo\|react-native\|metro\|watchman"

# Kill all node processes
echo "Killing Node processes..."
pkill -9 node

# Kill any Android emulator processes
echo "Stopping Android emulator..."
pkill -f "qemu-system-aarch64\|emulator\|adb"

# Reset ADB
echo "Resetting ADB..."
adb kill-server

# Clear watchman cache
echo "Clearing Watchman cache..."
watchman watch-del-all 2>/dev/null || echo "Watchman not installed or already cleared"

# Clear Metro bundler cache
echo "Clearing Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Remove node modules and reinstall
echo "Reinstalling node modules..."
rm -rf node_modules
npm install

# Clear React Native cache
echo "Clearing React Native cache..."
npx react-native start --reset-cache

echo "Environment reset complete! Try starting Expo again with:"
echo "npx expo start --clear"
