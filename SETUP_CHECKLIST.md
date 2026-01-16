# Runner Notes - Setup Checklist

Use this checklist to get Runner Notes up and running on your iOS device.

## 📋 Pre-Development Checklist

### 1. Firebase Project Setup
- [ ] Create Firebase project at https://console.firebase.google.com/
- [ ] Add iOS app to Firebase project
  - Bundle ID: `com.bishesh-panthos.runner-notes`
- [ ] Download `GoogleService-Info.plist`
- [ ] Place `GoogleService-Info.plist` in `ios/runnernotes/`

### 2. Firebase Authentication
- [ ] Go to Authentication → Sign-in method
- [ ] Enable Apple provider
- [ ] Configure Apple Sign-In:
  - Service ID
  - Key ID
  - Team ID
  - Private Key

### 3. Firestore Database
- [ ] Go to Firestore Database
- [ ] Create database in test mode (for development)
- [ ] Choose closest location
- [ ] Copy security rules from `FIREBASE_SETUP.md`
- [ ] Apply security rules in Rules tab

### 4. Apple Developer Configuration
- [ ] Sign in to Apple Developer account
- [ ] Enable "Sign in with Apple" capability
- [ ] Create Service ID
- [ ] Create Key for Sign in with Apple
- [ ] Add Service ID and Key to Firebase

### 5. Local Setup
- [ ] Install dependencies: `npm install`
- [ ] Navigate to iOS folder: `cd ios`
- [ ] Install pods: `pod install`
- [ ] Return to root: `cd ..`

## 🧪 Testing Checklist

### First Launch
- [ ] Build iOS app: `npx expo run:ios`
- [ ] App launches without errors
- [ ] Sign-In screen displays
- [ ] Apple Sign-In button is visible

### Authentication
- [ ] Tap Apple Sign-In button
- [ ] Apple authentication modal appears
- [ ] Successfully authenticate with Apple ID
- [ ] Redirected to Home screen
- [ ] User document created in Firestore

### Trail Management
- [ ] Tap + button on Home screen
- [ ] Create Run screen opens
- [ ] Tap Trail selector
- [ ] Modal opens with empty trail list
- [ ] Tap "Add New Trail"
- [ ] Enter trail name
- [ ] Tap Create
- [ ] Trail appears in list and is selected

### Location Permissions
- [ ] Start a run (with trail selected)
- [ ] Location permission prompt appears
- [ ] Grant "When in Use" permission
- [ ] GPS tracking starts

### Run Tracking
- [ ] Distance starts updating (move around)
- [ ] Timer is counting
- [ ] Pace is calculated
- [ ] Pause button works
- [ ] Resume button works
- [ ] Stop button shows confirmation alert

### Complete Run
- [ ] Confirm stop
- [ ] Navigated to Run Moment detail screen
- [ ] Stats display correctly
- [ ] Run Moment appears in Home list

### Journals
- [ ] Tap + to add journal on Run Moment detail
- [ ] Journal editor opens
- [ ] Type some text
- [ ] Auto-save indicator shows "Saving..."
- [ ] Shows "Saved" timestamp
- [ ] Navigate back
- [ ] Journal appears in list
- [ ] Tap journal to edit
- [ ] Delete button works

### Sign Out
- [ ] Tap sign out button on Home screen
- [ ] Returns to Sign-In screen

## 🐛 Common Issues

### Build Errors
**Problem**: Build fails with Firebase errors  
**Solution**: 
1. Ensure `GoogleService-Info.plist` is in `ios/runnernotes/`
2. Run `cd ios && pod install && cd ..`
3. Clean build folder in Xcode
4. Rebuild

**Problem**: "Module not found" errors  
**Solution**: 
1. Delete `node_modules`
2. Run `npm install`
3. Delete `ios/Pods`
4. Run `cd ios && pod install && cd ..`

### Runtime Errors
**Problem**: Apple Sign-In doesn't work  
**Solution**: 
- Must test on physical device (not simulator)
- Check Apple Developer Console configuration
- Verify Firebase Apple Sign-In is enabled

**Problem**: Location not updating  
**Solution**: 
- Test on physical device
- Ensure location permissions granted
- Check iOS Settings → Privacy → Location Services

**Problem**: Firestore permission denied  
**Solution**: 
- Check Firestore security rules
- Ensure user is authenticated
- Verify user ID matches in rules

## ✅ Deployment Checklist

### Before App Store Submission
- [ ] Test on multiple iOS devices
- [ ] Test with poor GPS signal
- [ ] Test with location permissions denied
- [ ] Test with network offline/online
- [ ] Update app icons
- [ ] Update splash screen
- [ ] Switch Firestore to production rules
- [ ] Configure proper Apple Sign-In for production
- [ ] Add privacy policy URL
- [ ] Add terms of service URL
- [ ] Test In-App Purchase (if applicable)
- [ ] Submit for App Review

## 📞 Support

If you encounter issues not covered here:
1. Check `FIREBASE_SETUP.md` for detailed Firebase instructions
2. Review `README.md` for architecture details
3. Check Firestore Console for data structure
4. Review Firebase Authentication logs
5. Check iOS device logs in Xcode

## 🎉 Success Criteria

Your setup is complete when you can:
1. ✅ Sign in with Apple
2. ✅ Create a trail
3. ✅ Start and track a run
4. ✅ Pause and resume tracking
5. ✅ Complete a run
6. ✅ View run details
7. ✅ Add and edit journals
8. ✅ Sign out and sign back in
9. ✅ See persisted data after restart

Congratulations! Runner Notes is ready to use! 🏃‍♂️
