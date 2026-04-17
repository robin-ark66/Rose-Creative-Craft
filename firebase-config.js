const FirebaseConfig = {
    apiKey: "AIzaSyD31YAiZOv9OOr53RQYZxYk1xuUZ9ZZAjs",
    authDomain: "rose-creative-craft.firebaseapp.com",
    projectId: "rose-creative-craft",
    storageBucket: "rose-creative-craft.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

let firebaseInitialized = false;
let db = null;
let storage = null;

async function initFirebase() {
    if (firebaseInitialized) return { db, storage };
    
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(FirebaseConfig);
            db = firebase.firestore();
            storage = firebase.storage();
            
            const settings = { experimentalAutoDetectLongPolling: true };
            db.settings(settings);
            
            await db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
            
            firebaseInitialized = true;
            console.log('Firebase initialized successfully');
            return { db, storage };
        } else {
            throw new Error('Firebase SDK not loaded');
        }
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
        return { db: null, storage: null };
    }
}

function waitForFirebase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const check = () => {
            if (firebaseInitialized || attempts >= maxAttempts) {
                resolve();
            } else {
                attempts++;
                setTimeout(check, 100);
            }
        };
        check();
    });
}

window.FirebaseConfig = FirebaseConfig;
window.initFirebase = initFirebase;
window.waitForFirebase = waitForFirebase;
