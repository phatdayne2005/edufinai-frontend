import React, { useState } from 'react';
import BottomNav from '../../components/layout/BottomNav';
import HomePage from '../home/HomePage';
import FinancePage from '../finance/FinancePage';
import LearningPage from '../learning/LearningPage';
import ChatBotPage from '../chatbot/ChatBotPage';
import ChallengesPage from '../challenges/ChallengesPage';
import ProfilePage from '../profile/ProfilePage';
import { styles } from '../../styles/appStyles';
import { tabs, defaultTab } from '../../constants/navigation';

const tabComponents = {
  home: HomePage,
  finance: FinancePage,
  learning: LearningPage,
  chatbot: ChatBotPage,
  challenges: ChallengesPage,
  profile: ProfilePage,
};

const AppShell = () => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const ActivePage = tabComponents[activeTab] || HomePage;

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

