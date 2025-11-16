import React, { useState, useEffect } from 'react';
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
  const ActivePage = tabComponents[activeTab] || HomePage;

  // Handle navigation state to set active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  return (
    <div style={styles.app}>
      <main style={styles.main}>
        <ActivePage />
      </main>
      <BottomNav
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={tabs}
      />
    </div>
  );
};

export default AppShell;

