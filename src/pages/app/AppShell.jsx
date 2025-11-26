import React, { useState, useEffect, useCallback } from 'react';
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

const AppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);

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
    </div>
  );
};

export default AppShell;
