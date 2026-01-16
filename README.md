# Runner Notes 🏃

Runner Notes is an iOS-first running tracking app that helps you record and journal your running journey. Think of it as Apple Notes meets Strava - each run becomes a "Run Moment" containing pace data, photos, voice memos, and journal entries.

## Features (MVP V1)

### ✅ Implemented
- **Apple Sign-In Authentication** - Secure Firebase authentication
- **Run Tracking** - GPS-based distance, duration, and pace calculation
- **Trail Management** - Create and select from custom trails
- **Run Moments List** - View all your past runs with key stats
- **Journal Entries** - Write and auto-save thoughts about each run
- **Dark Theme** - Beautiful minimal dark UI optimized for iOS

### 🎨 UI Only (Coming Soon)
- **Run Snaps** - Photo capture during runs
- **Run Memos** - Voice recordings during runs
- **Route Maps** - Visual map of your run path

## Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Authentication**: Firebase Auth with Apple Sign-In
- **Database**: Cloud Firestore
- **Location**: expo-location for GPS tracking
- **Language**: TypeScript

## Project Structure

```
runner-notes/
├── app/
│   ├── _layout.tsx              # Root layout with auth provider
│   ├── auth/
│   │   └── sign-in.tsx          # Apple Sign-In screen
│   ├── (tabs)/
│   │   └── index.tsx            # Home - Run Moments list
│   └── run/
│       ├── create.tsx           # Active run tracking
│       ├── [id].tsx             # Run Moment detail view
│       └── journal/
│           └── [id].tsx         # Journal editor
├── components/
│   ├── RunMomentCard.tsx        # Run list item
│   ├── TrailSelector.tsx        # Trail dropdown
│   ├── PaceDisplay.tsx          # Metrics display
│   ├── RunControls.tsx          # Start/pause/stop buttons
│   └── ui/                      # Reusable UI components
├── lib/
│   ├── firebase.ts              # Firebase initialization
│   ├── auth-context.tsx         # Auth state management
│   ├── firestore.ts             # Firestore helpers
│   └── location.ts              # GPS tracking utilities
└── constants/
    └── theme.ts                 # Dark theme colors
```

## Getting Started

### Prerequisites
- Node.js 18+
- iOS device or simulator (for testing)
- Firebase project
- Apple Developer account (for Apple Sign-In)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Follow instructions in `FIREBASE_SETUP.md`
   - Add `GoogleService-Info.plist` to `ios/runnernotes/`
   - Enable Apple Sign-In in Firebase Console
   - Set up Firestore with security rules

3. **Update iOS configuration**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Run on iOS**
   ```bash
   npx expo run:ios
   ```

## Firebase Setup

See `FIREBASE_SETUP.md` for detailed instructions on:
- Creating a Firebase project
- Enabling Apple Sign-In
- Setting up Firestore
- Configuring security rules
- iOS integration

## Usage

1. **Sign In** - Use Apple Sign-In on first launch
2. **Start a Run** - Tap the + button, select a trail, and start tracking
3. **Track Your Run** - View real-time distance, duration, and pace
4. **Pause/Resume** - Control your run with intuitive buttons
5. **Complete Run** - Stop the run to save it as a Run Moment
6. **Add Journals** - Write your thoughts about each run
7. **View History** - Browse all your past Run Moments

## Key Components

### Run Tracking
- GPS-based location tracking with expo-location
- Real-time pace calculation (min/km)
- Distance measurement using Haversine formula
- Timer with pause/resume functionality

### Data Model
```
users/{userId}
  └── trails/{trailId}
  └── runMoments/{runMomentId}
      ├── journals/{journalId}
      ├── snaps/{snapId} (future)
      └── memos/{memoId} (future)
```

### Design System
- **Background**: `#0A0A0A`
- **Surface**: `#1A1A1A`
- **Accent**: `#00D4AA` (teal/mint)
- **Text Primary**: `#FFFFFF`
- **Text Secondary**: `#888888`

## Development

### File-based Routing
Expo Router provides automatic routing based on file structure:
- `app/auth/sign-in.tsx` → `/auth/sign-in`
- `app/run/[id].tsx` → `/run/:id`
- `app/run/journal/[id].tsx` → `/run/journal/:id`

### State Management
- Auth state via React Context (`lib/auth-context.tsx`)
- Real-time Firestore subscriptions for data
- Local state for active run tracking

### Location Permissions
iOS requires location permissions configured in `app.json`:
- When in Use: For active run tracking
- Always: For background tracking (future feature)

## Testing

- Test on physical iOS device for accurate GPS tracking
- Simulator has limited location simulation capabilities
- Use different trails to test trail management
- Test pause/resume during active runs

## Troubleshooting

### Firebase not working
- Ensure `GoogleService-Info.plist` is in correct location
- Rebuild iOS app after adding Firebase files
- Check Firebase Console for proper iOS app configuration

### Location not tracking
- Verify location permissions in iOS Settings
- Check that permissions are requested in `app.json`
- Ensure testing on device (not simulator) for best results

### Apple Sign-In not working
- Requires physical device (won't work in simulator)
- Ensure Apple Sign-In is enabled in Firebase
- Check Apple Developer Console configuration

## Future Enhancements

- Photo capture during runs (Run Snaps)
- Voice memos during runs (Run Memos)
- Route mapping with visual path
- Statistics and analytics
- Social sharing
- Run challenges and goals
- Android support

## License

Private project - All rights reserved

## Author

Built with ❤️ for runners who love journaling
