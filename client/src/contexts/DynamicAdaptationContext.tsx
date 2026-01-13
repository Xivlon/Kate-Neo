/**
 * Dynamic Adaptation Context
 *
 * Provides global access to the dynamic adaptation setting,
 * allowing components to enable/disable responsive spacing behavior.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface DynamicAdaptationContextValue {
  /** Whether dynamic adaptation is enabled */
  enabled: boolean;
  /** Toggle dynamic adaptation on/off */
  setEnabled: (enabled: boolean) => void;
  /** Whether the setting has been loaded */
  isLoaded: boolean;
}

const DynamicAdaptationContext = createContext<DynamicAdaptationContextValue | null>(null);

interface DynamicAdaptationProviderProps {
  children: ReactNode;
}

export function DynamicAdaptationProvider({ children }: DynamicAdaptationProviderProps) {
  const [enabled, setEnabledState] = useState(true); // Default to enabled
  const [isLoaded, setIsLoaded] = useState(false);

  // Load setting from server on mount
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const res = await fetch('/api/settings?scope=workspace');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings?.appearance?.dynamicAdaptation !== undefined) {
            setEnabledState(data.settings.appearance.dynamicAdaptation);
          }
        }
      } catch (error) {
        console.error('[DynamicAdaptation] Failed to load setting:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSetting();
  }, []);

  // Save setting to server when changed
  const setEnabled = useCallback(async (newEnabled: boolean) => {
    setEnabledState(newEnabled);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'workspace',
          key: 'appearance.dynamicAdaptation',
          value: newEnabled,
        }),
      });
    } catch (error) {
      console.error('[DynamicAdaptation] Failed to save setting:', error);
    }
  }, []);

  return (
    <DynamicAdaptationContext.Provider value={{ enabled, setEnabled, isLoaded }}>
      {children}
    </DynamicAdaptationContext.Provider>
  );
}

/**
 * Hook to access the dynamic adaptation setting
 */
export function useDynamicAdaptation(): DynamicAdaptationContextValue {
  const context = useContext(DynamicAdaptationContext);

  if (!context) {
    // Return a default value if used outside provider (for components that may be tested in isolation)
    return {
      enabled: true,
      setEnabled: () => {},
      isLoaded: true,
    };
  }

  return context;
}

/**
 * Hook that returns whether dynamic adaptation should be active
 * Convenience hook for components that only need to check if it's enabled
 */
export function useDynamicAdaptationEnabled(): boolean {
  const { enabled, isLoaded } = useDynamicAdaptation();
  // Default to enabled while loading to prevent layout flash
  return !isLoaded || enabled;
}
