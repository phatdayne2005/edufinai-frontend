/* global globalThis */

import { initializeApp } from 'firebase/app';
import {
    getMessaging,
    getToken,
    onMessage,
    deleteToken as firebaseDeleteToken,
    isSupported,
} from 'firebase/messaging';
import firebaseConfig, { hasFirebaseConfig } from './firebaseConfig';
import { registerDeviceToken, unregisterDeviceToken } from '../services/notificationApi';

const FCM_TOKEN_STORAGE_KEY = 'edufinai_fcm_token';

let firebaseApp = null;
let messagingInstance = null;
let serviceWorkerRegistration = null;

const logFCM = (...args) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('[FCM]', ...args);
    }
};

const initFirebaseApp = () => {
    if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
        logFCM('Firebase app initialized', {
            projectId: firebaseConfig.projectId,
            hasConfig: hasFirebaseConfig,
        });
    }
    return firebaseApp;
};

const ensureMessagingInstance = async () => {
    if (messagingInstance) {
        return messagingInstance;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
        console.warn('Firebase messaging is not supported in this browser.');
        return null;
    }

    const app = initFirebaseApp();
    messagingInstance = getMessaging(app);
    logFCM('Messaging instance created');
    return messagingInstance;
};

const registerServiceWorker = async () => {
    if (serviceWorkerRegistration || !('serviceWorker' in navigator)) {
        return serviceWorkerRegistration;
    }

    try {
        serviceWorkerRegistration = await navigator.serviceWorker.register(
            `${process.env.PUBLIC_URL}/firebase-messaging-sw.js`
        );
        logFCM('Service worker registered');
        return serviceWorkerRegistration;
    } catch (error) {
        console.error('Failed to register Firebase messaging service worker:', error);
        return null;
    }
};

const saveTokenLocally = (token) => {
    if (token) {
        localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
        logFCM('FCM token saved locally');
    }
};

const removeTokenLocally = () => {
    localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
};

export const getSavedFcmToken = () => localStorage.getItem(FCM_TOKEN_STORAGE_KEY);

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('Notifications are not supported in this environment.');
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission === 'denied') {
        return 'denied';
    }

    return Notification.requestPermission();
};

const retrieveFcmToken = async () => {
    const messaging = await ensureMessagingInstance();
    if (!messaging) {
        return null;
    }

    await registerServiceWorker();

    const vapidKey =
        process.env.REACT_APP_FIREBASE_VAPID_KEY ||
        (typeof globalThis !== 'undefined' ? globalThis.__FIREBASE_VAPID_KEY : null);
    if (!vapidKey) {
        console.warn(
            'Missing VAPID key. Set REACT_APP_FIREBASE_VAPID_KEY or self.__FIREBASE_VAPID_KEY in public/firebase-config.js.'
        );
    }

    const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration,
    }).catch((error) => {
        console.error('Failed to get FCM token:', error);
        return null;
    });

    if (token) {
        saveTokenLocally(token);
        logFCM('FCM token retrieved', token.substring(0, 10));
    }

    return token;
};

export const promptAndRegisterNotificationToken = async (jwtTokenOverride) => {
    logFCM('Prompting notification permission', Notification.permission);
    const shouldAsk =
        Notification.permission === 'granted' ||
        (Notification.permission !== 'denied' &&
            window.confirm('Bạn có muốn bật thông báo để không bỏ lỡ cập nhật từ EduFinAI?'));

    if (!shouldAsk) {
        logFCM('User declined notification prompt');
        return null;
    }

    const permission = await requestNotificationPermission();
    logFCM('Notification permission result:', permission);
    if (permission !== 'granted') {
        return null;
    }

    const token = await retrieveFcmToken();
    if (token) {
        logFCM('Registering device token to backend');
        await registerDeviceToken(token, 'web', navigator.userAgent, jwtTokenOverride).catch((error) => {
            console.error('Failed to register device token:', error);
        });
    }

    return token;
};

export const unregisterNotificationToken = async (jwtTokenOverride) => {
    const storedToken = getSavedFcmToken();
    const messaging = await ensureMessagingInstance();

    if (storedToken) {
        logFCM('Unregistering device token from backend');
        await unregisterDeviceToken(storedToken, jwtTokenOverride).catch((error) => {
            console.error('Failed to unregister token on backend:', error);
        });
    }

    if (messaging) {
        await firebaseDeleteToken(messaging).catch((error) => {
            console.error('Failed to delete FCM token locally:', error);
        });
    }

    removeTokenLocally();
};

export const listenForegroundNotifications = (callback) => {
    let unsubscribe = null;
    let isCleanedUp = false;
    
    ensureMessagingInstance()
        .then((messaging) => {
            if (!messaging || isCleanedUp) {
                logFCM('Cannot setup foreground listener: messaging not available or already cleaned up');
                return;
            }
            
            try {
                unsubscribe = onMessage(messaging, (payload) => {
                    logFCM('Foreground notification received', payload);
                    if (callback && typeof callback === 'function') {
                        try {
                            callback(payload);
                        } catch (error) {
                            console.error('[FCM] Error in foreground notification callback:', error);
                        }
                    }
                });
                logFCM('Foreground notification listener registered');
            } catch (error) {
                console.error('[FCM] Failed to register foreground notification listener:', error);
            }
        })
        .catch((error) => {
            console.error('[FCM] Failed to initialize messaging for foreground notifications:', error);
        });
    
    return () => {
        isCleanedUp = true;
        if (unsubscribe && typeof unsubscribe === 'function') {
            try {
                unsubscribe();
                logFCM('Foreground notification listener unsubscribed');
            } catch (error) {
                console.error('[FCM] Error unsubscribing foreground listener:', error);
            }
        }
    };
};

