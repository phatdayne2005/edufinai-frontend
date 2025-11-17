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
    </div>
  );
};

export default AppShell;

