# Firebase Setup Guide for Rose Creative Craft

Follow these steps to enable cloud storage for your website.

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `rose-creative-craft` (or your choice)
4. Disable Google Analytics (optional) → Click **"Create project"**
5. Wait for project to be created → Click **"Continue"**

---

## Step 2: Enable Firestore Database

1. In Firebase Console, go to **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll add security later)
4. Choose a location closest to your users (e.g., India or Asia)
5. Click **"Enable"**

---

## Step 3: Get Your Firebase Config

1. Go to **Project Settings** (gear icon ⚙️)
2. Scroll down to **"Your apps"**
3. Click the web icon (`</>`) to add a web app
4. Register app with nickname: `rose-creative-craft`
5. **Copy the `firebaseConfig` object**

Your config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "rose-creative-craft.firebaseapp.com",
  projectId: "rose-creative-craft",
  storageBucket: "rose-creative-craft.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 4: Update Config File

1. Open `firebase-config.js` in your project folder
2. Replace the placeholder values with your actual Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
3. Save the file

---

## Step 5: Deploy & Test

1. Upload all files to your hosting (including `firebase-config.js`)
2. Open your website
3. Go to **Admin** → Add some categories and images
4. Check Firebase Console → **Firestore Database** to see your data

---

## How It Works

- **Without Firebase**: Data is stored in your browser only (localStorage)
- **With Firebase**: Data syncs to cloud, accessible from any device

The website will automatically:
- Sync data to Firebase when you add/update/delete categories or images
- Load data from Firebase when the page opens

---

## Firebase Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| Firestore Storage | 1 GB |
| Reads | 50,000/day |
| Writes | 20,000/day |
| Deletes | 20,000/day |

For a small portfolio website, this is more than enough!

---

## Troubleshooting

**Q: Website shows "Firebase not configured"**
A: Make sure you updated `firebase-config.js` with your actual config.

**Q: Data not syncing**
A: Check browser console (F12) for errors. Make sure Firestore is enabled.

**Q: Want to start fresh**
A: In Firebase Console, delete all documents from `categories` and `images` collections.

---

## Security (Optional - For Later)

For now, test mode allows anyone to read/write. To secure:

1. Go to Firestore Database → Rules
2. Update rules to require authentication
3. Add Firebase Auth (optional)

---

## Need Help?

If you need assistance with Firebase setup, let me know!
