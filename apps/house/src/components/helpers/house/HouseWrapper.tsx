import React, { createContext, useContext } from "react";

const RadioAutoplayContext = createContext(false);
export function useRadioAutoplay() {
  return useContext(RadioAutoplayContext);
}

// Marketing-site wrapper: no gate, no radio — just render children.
export function HouseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RadioAutoplayContext.Provider value={false}>
      {children}
    </RadioAutoplayContext.Provider>
  );
}
