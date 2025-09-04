
'use client';

import { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';

type ActionCallback = (() => void) | null;

interface ActionCallbackContextType {
  callback: ActionCallback;
  setCallback: (callback: ActionCallback) => void;
}

const ActionCallbackContext = createContext<ActionCallbackContextType | undefined>(undefined);

export function useActionCallback() {
  const context = useContext(ActionCallbackContext);
  if (!context) {
    throw new Error('useActionCallback must be used within an ActionCallbackProvider');
  }
  return context;
}

export function ActionCallbackProvider({ children }: { children: ReactNode }) {
  const [callback, setCallback] = useState<ActionCallback>(null);
  
  const handleSetCallback = useCallback((cb: ActionCallback) => {
    setCallback(() => cb);
  }, []);

  const value = useMemo(() => ({
    callback,
    setCallback: handleSetCallback,
  }), [callback, handleSetCallback]);

  return (
    <ActionCallbackContext.Provider value={value}>
      {children}
    </ActionCallbackContext.Provider>
  );
}
