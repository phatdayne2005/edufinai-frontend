/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');
importScripts('/firebase-config.js');

if (!self.__FIREBASE_CONFIG) {
    console.error('Missing firebase config. Please create public/firebase-config.js');
}

firebase.initializeApp(self.__FIREBASE_CONFIG || {});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || payload.data?.title || 'EduFinAI';
    const notificationBody = payload.notification?.body || payload.data?.body || 'Bạn có thông báo mới.';
    const icon = payload.notification?.icon || '/logo192.png';

    const notificationOptions = {
        body: notificationBody,
        icon,
        badge: '/logo192.png',
        data: {
            url: payload.data?.url || '/',
            ...payload.data,
        },
        actions: payload.data?.actions ? JSON.parse(payload.data.actions) : [],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
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

