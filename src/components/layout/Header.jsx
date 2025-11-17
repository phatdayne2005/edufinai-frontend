import React from 'react';
import { styles } from '../../styles/appStyles';

const Header = ({ title, subtitle, action }) => (
  <header style={styles.header}>
    <div>
      <h1 style={styles.headerTitle}>{title}</h1>
      {subtitle ? <p style={styles.headerSubtitle}>{subtitle}</p> : null}
    </div>
    {action ? <div>{action}</div> : null}
  </header>
);

export default Header;

