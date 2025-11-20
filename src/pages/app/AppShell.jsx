import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import HomePage from '../home/HomePage';
import FinancePage from '../finance/FinancePage';
import LearningPage from '../learning/LearningPage';
import ChallengesPage from '../challenges/ChallengesPage';
import ProfilePage from '../profile/ProfilePage';
import { styles } from '../../styles/appStyles';
import { tabs, defaultTab } from '../../constants/navigation';
import { listenForegroundNotifications } from '../../firebase/firebaseMessaging';

const tabComponents = {
  home: HomePage,
  finance: FinancePage,
  learning: LearningPage,
  challenges: ChallengesPage,
  profile: ProfilePage,
};

const AppShell = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [transitionDirection, setTransitionDirection] = useState('forward');
  const [incomingNotification, setIncomingNotification] = useState(null);
  const ActivePage = tabComponents[activeTab] || HomePage;
  const tabOrder = useMemo(() => tabs.map((tab) => tab.id), []);

  const handleTabChange = useCallback((nextTab) => {
    if (!nextTab || nextTab === activeTab) return;
    const currentIndex = tabOrder.indexOf(activeTab);
    const nextIndex = tabOrder.indexOf(nextTab);
    if (nextIndex === -1) return;
    setTransitionDirection(nextIndex > currentIndex ? 'forward' : 'backward');
    setActiveTab(nextTab);
  }, [activeTab, tabOrder]);

  // Handle navigation state to set active tab
  useEffect(() => {
    const requestedTab = location.state?.activeTab;
    if (requestedTab && requestedTab !== activeTab) {
      handleTabChange(requestedTab);
    }
  }, [location.state?.activeTab, handleTabChange, activeTab]);

  // Listen to foreground FCM notifications for debugging
  useEffect(() => {
    const unsubscribe = listenForegroundNotifications((payload) => {
      const notificationTitle =
        payload?.notification?.title || payload?.data?.title || 'EduFinAI';
      const notificationBody =
        payload?.notification?.body || payload?.data?.body || 'Bạn có thông báo mới.';

      if (typeof window !== 'undefined') {
        window.__latestFcmPayload = payload;
        console.log('[FCM] Payload stored at window.__latestFcmPayload', payload);
      }

      setIncomingNotification({
        title: notificationTitle,
        body: notificationBody,
        actionUrl: payload?.data?.url || '/',
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // Auto hide toast after 6s
  useEffect(() => {
    if (!incomingNotification) {
      return undefined;
    }
    const timer = setTimeout(() => setIncomingNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [incomingNotification]);

  const handleNotificationClick = () => {
    if (incomingNotification?.actionUrl) {
      window.open(incomingNotification.actionUrl, '_self');
    }
    setIncomingNotification(null);
  };

  return (
    <div style={styles.app} className="app-shell">
      <main style={styles.main} className="app-shell__main">
        <div
          key={activeTab}
          className={`tab-transition tab-transition--${transitionDirection}`}
        >
          <ActivePage />
        </div>
      </main>
      <BottomNav
        activeTab={activeTab}
        onChange={handleTabChange}
        tabs={tabs}
      />
      {incomingNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 280,
            maxWidth: '90%',
            background: '#111827',
            color: '#fff',
            padding: '16px 20px',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            zIndex: 9999,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
          onClick={handleNotificationClick}
        >
          <strong style={{ fontSize: 16 }}>{incomingNotification.title}</strong>
          <span style={{ fontSize: 14, opacity: 0.9 }}>
            {incomingNotification.body}
          </span>
          <span style={{ fontSize: 12, opacity: 0.6 }}>
            Nhấn để mở {incomingNotification.actionUrl || 'nội dung'}
          </span>
        </div>
      )}
    </div>
  );
};

export default AppShell;

