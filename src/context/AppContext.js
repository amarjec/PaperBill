import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // list acts as the global cart. 
  // Structure: { 'product_id': { _id: '...', label: '...', sellingPrice: 100, qty: 2 } }
  const [list, setList] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  return (
    <AppContext.Provider value={{ list, setList, selectedCustomer, setSelectedCustomer }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);