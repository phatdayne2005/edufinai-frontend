import React, { createContext, useContext } from 'react';
import mockData from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => (
  <AppContext.Provider value={mockData}>{children}</AppContext.Provider>
);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;

