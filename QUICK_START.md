# Quick Start Guide - Runner Notes

Get up and running in 5 minutes! ⚡

## Prerequisites
- Node.js installed
- Xcode installed (for iOS)
- Firebase account
- Apple Developer account

## 🚀 Fast Track Setup

### Step 1: Firebase (5 min)
1. Go to https://console.firebase.google.com/
2. Create new project "Runner Notes"
3. Add iOS app with bundle ID: `com.bishesh-panthos.runner-notes`
4. Download `GoogleService-Info.plist`
5. Place file in: `ios/runnernotes/GoogleService-Info.plist`

### Step 2: Enable Services (3 min)
```
Firebase Console:
├── Authentication → Enable "Apple"
├── Firestore → Create database (test mode)
└── Rules → Copy from FIREBASE_SETUP.md
```

### Step 3: Install & Build (2 min)
```bash
# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Build and run
npx expo run:ios
```

## 🎯 First Run Checklist

1. ✅ App launches → Sign-In screen appears
2. ✅ Tap Apple Sign-In → Authenticate
3. ✅ Home screen appears (empty)
4. ✅ Tap + button → Create Run screen
5. ✅ Select Trail → Create "Morning Run"
6. ✅ Tap Start → Grant location permission
7. ✅ Walk around → See distance/pace update
8. ✅ Tap Stop → Confirm and save
9. ✅ View run details → See stats
10. ✅ Tap + for journal → Write and auto-save

## 📱 Running the App

### Development
```bash
# Start development server
npm start

# Run on iOS
npx expo run:ios

# Run on specific device
npx expo run:ios --device
```

### Troubleshooting

**Can't build?**
```bash
# Clean and rebuild
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx expo run:ios
```

**Firebase not working?**
- Check `GoogleService-Info.plist` is in `ios/runnernotes/`
- Restart Xcode
- Clean build folder

**Location not tracking?**
- Test on physical device (simulator is limited)
- Check location permissions in Settings
- Ensure you granted "When in Use" permission

## 📚 Documentation

- **Full Setup**: See `FIREBASE_SETUP.md`
- **Testing**: See `SETUP_CHECKLIST.md`
- **Architecture**: See `README.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`

## 🎨 Project Structure

```
Key Files:
├── app/(tabs)/index.tsx        → Home screen
├── app/run/create.tsx          → Active run tracking
├── app/run/[id].tsx            → Run details
├── lib/auth-context.tsx        → Authentication
├── lib/firestore.ts            → Database operations
└── lib/location.ts             → GPS tracking
```

## 🔥 Firebase Configuration Required

You MUST complete these steps before the app will work:

1. **Add GoogleService-Info.plist** to `ios/runnernotes/`
2. **Enable Apple Sign-In** in Firebase Console
3. **Create Firestore database**
4. **Apply security rules** from FIREBASE_SETUP.md

## ✅ Verification

Your setup is successful if you can:
- ✅ Sign in with Apple
- ✅ Create a trail
- ✅ Track a run with GPS
- ✅ Save and view run details
- ✅ Add journal entries

## 🆘 Need Help?

1. Check `SETUP_CHECKLIST.md` for detailed testing steps
2. Review `FIREBASE_SETUP.md` for Firebase configuration
3. Read `README.md` for architecture details
4. Check Firebase Console logs for errors

## 🎉 You're Ready!

Once you complete the Firebase setup and build successfully, you have a fully functional running tracking app!

Happy running! 🏃‍♂️💨
