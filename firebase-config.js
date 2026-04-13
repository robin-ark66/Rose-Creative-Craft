// Firebase Configuration
// Follow these steps to set up Firebase for your project:

/*
================================================================================
STEP 1: Create a Firebase Project
================================================================================
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: "rose-creative-craft" (or your choice)
4. Disable Google Analytics (optional, click "Create project")
5. Wait for project to be created, then click "Continue"

================================================================================
STEP 2: Enable Firestore Database
================================================================================
1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Select "Start in test mode" (we'll add security later)
4. Choose a location closest to your users
5. Click "Enable"

================================================================================
STEP 3: Get Your Firebase Config
================================================================================
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (</>) to add a web app
4. Register app with a nickname
5. Copy the firebaseConfig object

================================================================================
STEP 4: Update This File
================================================================================
Replace the firebaseConfig below with your own config from Step 3.

Your config will look like this:
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
*/

const firebaseConfig = {
  apiKey: "AIzaSyD31YAiZOv9OOr53RQYZxYk1xuUZ9ZZAjs",
  authDomain: "rose-creative-craft.firebaseapp.com",
  projectId: "rose-creative-craft",
  storageBucket: "rose-creative-craft.firebasestorage.app",
  messagingSenderId: "668663986772",
  appId: "1:668663986772:web:a4691aa351cfd46851cbc1"
};

// Initialize Firebase
let app, db, storage;

function initFirebase() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn("Firebase not configured. Using localStorage fallback.");
    return false;
  }
  
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  storage = firebase.storage();
  return true;
}

// Check if Firebase is configured
function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";
}

// Initialize on load
const firebaseReady = initFirebase();
