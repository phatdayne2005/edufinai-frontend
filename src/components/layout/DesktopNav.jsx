import React from 'react';
import PropTypes from 'prop-types';
import './DesktopNav.css';

const DesktopNav = ({ tabs, activeTab, onChange }) => (
  <nav className="desktop-nav">
    {tabs.map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        type="button"
        className={`desktop-nav__item${activeTab === id ? ' desktop-nav__item--active' : ''}`}
        onClick={() => onChange(id)}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    ))}
  </nav>
);

DesktopNav.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    }),
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default DesktopNav;

