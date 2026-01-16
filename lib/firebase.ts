import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

// Firebase configuration
// Note: For iOS, configuration is done via GoogleService-Info.plist
// This file initializes the Firebase modules

const firebaseConfig = {
  // iOS configuration comes from GoogleService-Info.plist
  // Android configuration would come from google-services.json
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth;
export const firestore = firebase.firestore;
export default firebase;
