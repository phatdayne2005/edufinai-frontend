/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');
importScripts('/firebase-config.js');

if (!self.__FIREBASE_CONFIG) {
    console.error('Missing firebase config. Please create public/firebase-config.js');
}

firebase.initializeApp(self.__FIREBASE_CONFIG || {});

const messaging = firebase.messaging();

const parseActions = (rawActions) => {
    if (!rawActions) {
        return [];
    }
    try {
        const parsed = typeof rawActions === 'string' ? JSON.parse(rawActions) : rawActions;
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('[FCM][SW] Unable to parse actions payload', error);
        return [];
    }
};

const buildNotificationFromData = (dataPayload = {}) => {
    const notificationTitle = dataPayload.title || 'EduFinAI';
    const notificationBody = dataPayload.body || 'Bạn có thông báo mới.';
    const icon = dataPayload.icon || '/logo192.png';
    const badge = dataPayload.badge || '/logo192.png';
    const targetUrl = dataPayload.url || '/';

    return {
        title: notificationTitle,
        options: {
            body: notificationBody,
            icon,
            badge,
            data: {
                url: targetUrl,
                ...dataPayload,
            },
            actions: parseActions(dataPayload.actions),
        },
    };
};

messaging.onBackgroundMessage((payload) => {
    if (payload?.notification) {
        console.warn(
            '[FCM][SW] Received push payload with "notification" field. To avoid duplicate toasts, send data-only payloads.'
        );
    }

    const dataPayload = payload?.data || {};
    const notification = buildNotificationFromData(dataPayload);

    self.registration.showNotification(notification.title, notification.options);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';
    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        client.postMessage({ type: 'notification-click', data: event.notification.data });
                        return;
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
                return null;
            })
    );
});

