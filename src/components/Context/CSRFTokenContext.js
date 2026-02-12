import React, { createContext, useState, useContext } from "react";

const CSRFTokenContext = createContext();

export const CSRFTokenProvider = ({ children }) => {
  const [CSRFToken, setCSRFToken] = useState(
    "d1a7b3c2-97d8-4d49-b4f3-e2f3d8765470"
  );

  const simpanCSRFToken = (newToken) => {
    setCSRFToken(newToken);
  };

  return (
    <CSRFTokenContext.Provider value={{ CSRFToken, simpanCSRFToken }}>
      {children}
    </CSRFTokenContext.Provider>
  );
};

export const useCSRFTokenContext = () => useContext(CSRFTokenContext);
