import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import HomePage from '../home/HomePage';
import FinancePage from '../finance/FinancePage';
import LearningPage from '../learning/LearningPage';
import LessonDetailPage from '../learning/LessonDetailPage';
import QuizPage from '../learning/QuizPage';
import ChallengesPage from '../challenges/ChallengesPage';
import ProfilePage from '../profile/ProfilePage';
import ChatBotPage from '../chat/ChatBotPage';
import BalanceGuard from '../../components/finance/BalanceGuard';
import CreateLessonPage from '../creator/CreateLessonPage';
import { styles } from '../../styles/appStyles';
import { tabs, defaultTab } from '../../constants/navigation';
import { listenForegroundNotifications } from '../../firebase/firebaseMessaging';

const AppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [incomingNotification, setIncomingNotification] = useState(null);

  // Determine active tab from path
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/learning')) {
      setActiveTab('learning');
    } else if (path.startsWith('/finance')) {
      setActiveTab('finance');
    } else if (path.startsWith('/ai-chat')) {
      setActiveTab('ai-chat');
    } else if (path.startsWith('/challenges')) {
      setActiveTab('challenges');
    } else if (path.startsWith('/profile')) {
      setActiveTab('profile');
    } else if (path === '/' || path === '/home') {
      setActiveTab('home');
    }
  }, [location.pathname]);

  const handleTabChange = useCallback((nextTab) => {
    if (!nextTab || nextTab === activeTab) return;

    // Navigate to the tab's root path
    const tabPaths = {
      home: '/',
      finance: '/finance',
      learning: '/learning',
      'ai-chat': '/ai-chat',
      challenges: '/challenges',
      profile: '/profile',
    };
    navigate(tabPaths[nextTab] || '/');

    // Scroll to top when changing tabs
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, navigate]);

  // Handle navigation state to set active tab
  useEffect(() => {
    const requestedTab = location.state?.activeTab;
    const goalId = location.state?.goalId;
    if (requestedTab && requestedTab !== activeTab) {
      handleTabChange(requestedTab);
      // Keep goalId in state if it exists (for FinancePage to scroll to goal)
      navigate(location.pathname, { replace: true, state: goalId ? { goalId } : {} });
    }
  }, [location.state?.activeTab, location.state?.goalId, handleTabChange, activeTab, navigate, location.pathname]);

  // Listen to foreground FCM notifications
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

  // Check if we're on a sub-route that shouldn't show bottom nav
  const shouldShowBottomNav = !location.pathname.match(/\/(learning\/lesson|learning\/quiz|creator\/lesson)/);

  return (
    <div style={styles.app} className="app-shell">
      <main style={styles.main} className="app-shell__main">
        <Routes>
          {/* Main tab routes */}
          <Route path="/" element={<BalanceGuard><HomePage /></BalanceGuard>} />
          <Route path="/home" element={<BalanceGuard><HomePage /></BalanceGuard>} />
          <Route path="/finance" element={<BalanceGuard><FinancePage /></BalanceGuard>} />

          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/lesson/:slug" element={<LessonDetailPage />} />
          <Route path="/learning/quiz/:slug" element={<QuizPage />} />
          <Route path="/ai-chat" element={<ChatBotPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Creator routes */}
          <Route path="/creator/lesson/new" element={<CreateLessonPage />} />
          <Route path="/creator/lesson/edit/:lessonId" element={<CreateLessonPage />} />
        </Routes>
      </main>
      {shouldShowBottomNav && (
        <BottomNav
          activeTab={activeTab}
          onChange={handleTabChange}
          tabs={tabs}
        />
      )}
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
