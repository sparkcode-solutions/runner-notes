# Firebase Setup Guide for Runner Notes

## Prerequisites
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one

## iOS Configuration

### Step 1: Add iOS App to Firebase
1. In Firebase Console, click "Add app" and select iOS
2. Enter your iOS bundle ID: `com.anonymous.runnernotes` (or your actual bundle ID from `app.json`)
3. Download `GoogleService-Info.plist`
4. Place the file at: `ios/runnernotes/GoogleService-Info.plist`

### Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable "Apple" provider
3. Follow the instructions to configure Apple Sign-In:
   - You'll need an Apple Developer account
   - Configure your Apple Developer Console with Sign in with Apple capability
   - Add your Service ID and Key ID to Firebase

### Step 3: Enable Firestore
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in test mode (for development)
4. Choose a location close to your users

### Step 4: Firestore Security Rules
Set up these security rules in Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /trails/{trailId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /runMoments/{runMomentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /journals/{journalId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

### Step 5: Update app.json
Ensure your `app.json` has the Apple Sign-In entitlement:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.anonymous.runnernotes",
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to track your runs.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to track your runs in the background."
      }
    }
  }
}
```

### Step 6: Rebuild iOS app
After adding the GoogleService-Info.plist file:
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

## Testing
1. Run the app on a physical iOS device or simulator
2. Test Apple Sign-In flow
3. Verify Firestore writes in Firebase Console
