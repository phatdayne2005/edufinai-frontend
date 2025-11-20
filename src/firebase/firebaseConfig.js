const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

export const hasFirebaseEnvConfig =
    Object.values(firebaseConfig).every(Boolean) && !!process.env.REACT_APP_FIREBASE_VAPID_KEY;

if (process.env.NODE_ENV !== 'production' && !hasFirebaseEnvConfig) {
    // eslint-disable-next-line no-console
    console.warn(
        '[Firebase] Missing configuration in environment variables. Please set REACT_APP_FIREBASE_* values.'
    );
}

export default firebaseConfig;

