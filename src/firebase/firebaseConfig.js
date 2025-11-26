// Fallback config from public/firebase-config.js values
// These will be used if environment variables are not set
const fallbackConfig = {
    apiKey: "AIzaSyB6RSBn1-Pm8yAbaisI-EPOKO1wqAXyoqw",
    authDomain: "edufinai-firebase-notification.firebaseapp.com",
    projectId: "edufinai-firebase-notification",
    storageBucket: "edufinai-firebase-notification.firebasestorage.app",
    messagingSenderId: "290466433906",
    appId: "1:290466433906:web:60c58bd270def9d915ebeb",
    measurementId: "G-LRP5MCBBZF"
};

// Config from environment variables (with fallback)
const envFirebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || fallbackConfig.apiKey,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
    appId: process.env.REACT_APP_FIREBASE_APP_ID || fallbackConfig.appId,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId,
};

// Config from global (service worker) - takes priority if available
const globalFirebaseConfig =
    typeof globalThis !== 'undefined' && globalThis.__FIREBASE_CONFIG
        ? globalThis.__FIREBASE_CONFIG
        : null;

// Final config: global config (from service worker) takes priority, otherwise use env config
const firebaseConfig = globalFirebaseConfig || envFirebaseConfig;

export const hasFirebaseEnvConfig =
    Object.values(envFirebaseConfig).every(Boolean) && !!process.env.REACT_APP_FIREBASE_VAPID_KEY;

export const hasFirebaseGlobalConfig =
    !!globalFirebaseConfig && Object.values(globalFirebaseConfig).every(Boolean);

export const hasFirebaseConfig = hasFirebaseEnvConfig || hasFirebaseGlobalConfig;

if (process.env.NODE_ENV !== 'production' && !hasFirebaseConfig) {
    // eslint-disable-next-line no-console
    console.warn(
        '[Firebase] Missing configuration in environment variables. Using fallback config from firebase-config.js'
    );
}

export default firebaseConfig;

