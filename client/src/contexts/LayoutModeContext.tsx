/**
 * Layout Mode Context
 *
 * Provides global access to the layout mode setting,
 * allowing components to switch between flex and grid layouts.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type LayoutMode = 'flex' | 'grid';

interface LayoutModeContextValue {
  /** Current layout mode */
  layoutMode: LayoutMode;
  /** Set the layout mode */
  setLayoutMode: (mode: LayoutMode) => void;
  /** Whether the setting has been loaded */
  isLoaded: boolean;
}

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null);

interface LayoutModeProviderProps {
  children: ReactNode;
}

export function LayoutModeProvider({ children }: LayoutModeProviderProps) {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>('flex'); // Default to flex
  const [isLoaded, setIsLoaded] = useState(false);

  // Load setting from server on mount
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const res = await fetch('/api/settings?scope=workspace');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings?.appearance?.layoutMode) {
            setLayoutModeState(data.settings.appearance.layoutMode);
          }
        }
      } catch (error) {
        console.error('[LayoutMode] Failed to load setting:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSetting();
  }, []);

  // Save setting to server when changed
  const setLayoutMode = useCallback(async (newMode: LayoutMode) => {
    setLayoutModeState(newMode);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'workspace',
          key: 'appearance.layoutMode',
          value: newMode,
        }),
      });
    } catch (error) {
      console.error('[LayoutMode] Failed to save setting:', error);
    }
  }, []);

  return (
    <LayoutModeContext.Provider value={{ layoutMode, setLayoutMode, isLoaded }}>
      {children}
    </LayoutModeContext.Provider>
  );
}

/**
 * Hook to access the layout mode setting
 */
export function useLayoutMode(): LayoutModeContextValue {
  const context = useContext(LayoutModeContext);

  if (!context) {
    // Return a default value if used outside provider
    return {
      layoutMode: 'flex',
      setLayoutMode: () => {},
      isLoaded: true,
    };
  }

  return context;
}

/**
 * Hook that returns whether grid layout mode is active
 */
export function useIsGridLayout(): boolean {
  const { layoutMode, isLoaded } = useLayoutMode();
  return isLoaded && layoutMode === 'grid';
}
