import React from 'react';
import { styles } from '../../styles/appStyles';

const BottomNav = ({ activeTab, onChange, tabs }) => (
  <nav style={styles.bottomNav} className="app-shell__bottom-nav">
    {tabs.map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        className="bottom-nav__button"
        data-active={activeTab === id}
        style={styles.navButton}
      >
        <Icon size={24} className="icon-hover" />
        <span style={styles.navLabel}>{label}</span>
      </button>
    ))}
  </nav>
);

export default BottomNav;

