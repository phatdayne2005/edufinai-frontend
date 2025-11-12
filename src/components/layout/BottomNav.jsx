import React from 'react';
import { styles } from '../../styles/appStyles';

const BottomNav = ({ activeTab, onChange, tabs }) => (
  <nav style={styles.bottomNav}>
    {tabs.map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        style={{
          ...styles.navButton,
          color: activeTab === id ? '#4CAF50' : '#666',
        }}
      >
        <Icon size={24} />
        <span style={styles.navLabel}>{label}</span>
      </button>
    ))}
  </nav>
);

export default BottomNav;

