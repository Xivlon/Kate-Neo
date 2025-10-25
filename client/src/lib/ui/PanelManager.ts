/**
 * Panel Manager - UI panel and layout management
 * 
 * Manages the visibility, position, and state of IDE panels
 */

import { eventBus, IDEEventType } from '../events/EventBus';

export type PanelPosition = 'left' | 'right' | 'bottom' | 'top';

export interface Panel {
  id: string;
  title: string;
  position: PanelPosition;
  visible: boolean;
  size?: number; // Size in pixels or percentage
  minSize?: number;
  maxSize?: number;
  component?: string; // Component name to render
  order?: number; // Display order within position
}

export interface PanelLayout {
  panels: Panel[];
  activePanel?: string;
}

export type PanelChangeListener = (panels: Panel[]) => void;

/**
 * Panel Manager Class
 * 
 * Manages UI panels and their layout
 */
export class PanelManager {
  private panels: Map<string, Panel> = new Map();
  private changeListeners: Set<PanelChangeListener> = new Set();
  private readonly STORAGE_KEY = 'kate-ide-panel-layout';

  constructor() {
    this.loadLayout();
    console.log('[PanelManager] Initialized');
  }

  /**
   * Register a panel
   */
  registerPanel(panel: Panel): void {
    this.panels.set(panel.id, panel);
    this.saveLayout();
    this.notifyListeners();
    
    eventBus.emit(IDEEventType.PANEL_OPENED, panel);
    console.log(`[PanelManager] Panel registered: ${panel.id}`);
  }

  /**
   * Unregister a panel
   */
  unregisterPanel(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) {
      return false;
    }

    this.panels.delete(panelId);
    this.saveLayout();
    this.notifyListeners();
    
    eventBus.emit(IDEEventType.PANEL_CLOSED, { panelId });
    console.log(`[PanelManager] Panel unregistered: ${panelId}`);
    
    return true;
  }

  /**
   * Get a panel by ID
   */
  getPanel(panelId: string): Panel | undefined {
    return this.panels.get(panelId);
  }

  /**
   * Get all panels
   */
  getAllPanels(): Panel[] {
    return Array.from(this.panels.values());
  }

  /**
   * Get panels by position
   */
  getPanelsByPosition(position: PanelPosition): Panel[] {
    return Array.from(this.panels.values())
      .filter(p => p.position === position)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Show a panel
   */
  showPanel(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) {
      return false;
    }

    panel.visible = true;
    this.saveLayout();
    this.notifyListeners();
    
    eventBus.emit(IDEEventType.PANEL_OPENED, panel);
    
    return true;
  }

  /**
   * Hide a panel
   */
  hidePanel(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) {
      return false;
    }

    panel.visible = false;
    this.saveLayout();
    this.notifyListeners();
    
    eventBus.emit(IDEEventType.PANEL_CLOSED, { panelId });
    
    return true;
  }

  /**
   * Toggle panel visibility
   */
  togglePanel(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) {
      return false;
    }

    return panel.visible ? this.hidePanel(panelId) : this.showPanel(panelId);
  }

  /**
   * Update panel properties
   */
  updatePanel(panelId: string, updates: Partial<Panel>): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) {
      return false;
    }

    Object.assign(panel, updates);
    this.saveLayout();
    this.notifyListeners();
    
    return true;
  }

  /**
   * Resize a panel
   */
  resizePanel(panelId: string, size: number): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) {
      return false;
    }

    // Enforce min/max constraints
    if (panel.minSize && size < panel.minSize) {
      size = panel.minSize;
    }
    if (panel.maxSize && size > panel.maxSize) {
      size = panel.maxSize;
    }

    panel.size = size;
    this.saveLayout();
    this.notifyListeners();
    
    return true;
  }

  /**
   * Move panel to a different position
   */
  movePanel(panelId: string, position: PanelPosition): boolean {
    const panel = this.panels.get(panelId);
    if (!panel) {
      return false;
    }

    panel.position = position;
    this.saveLayout();
    this.notifyListeners();
    
    return true;
  }

  /**
   * Get visible panels
   */
  getVisiblePanels(): Panel[] {
    return Array.from(this.panels.values()).filter(p => p.visible);
  }

  /**
   * Check if a panel is visible
   */
  isPanelVisible(panelId: string): boolean {
    const panel = this.panels.get(panelId);
    return panel ? panel.visible : false;
  }

  /**
   * Add change listener
   */
  onChange(listener: PanelChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Notify listeners of changes
   */
  private notifyListeners(): void {
    const panels = this.getAllPanels();
    this.changeListeners.forEach(listener => {
      try {
        listener(panels);
      } catch (error) {
        console.error('[PanelManager] Error in change listener:', error);
      }
    });
  }

  /**
   * Save layout to storage
   */
  private saveLayout(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const layout: PanelLayout = {
        panels: this.getAllPanels(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.error('[PanelManager] Failed to save layout:', error);
    }
  }

  /**
   * Load layout from storage
   */
  private loadLayout(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.initializeDefaultPanels();
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const layout: PanelLayout = JSON.parse(stored);
        layout.panels.forEach(panel => {
          this.panels.set(panel.id, panel);
        });
      } else {
        this.initializeDefaultPanels();
      }
    } catch (error) {
      console.error('[PanelManager] Failed to load layout:', error);
      this.initializeDefaultPanels();
    }
  }

  /**
   * Initialize default panels
   */
  private initializeDefaultPanels(): void {
    const defaultPanels: Panel[] = [
      {
        id: 'explorer',
        title: 'Explorer',
        position: 'left',
        visible: true,
        size: 250,
        minSize: 150,
        maxSize: 500,
        order: 0,
      },
      {
        id: 'search',
        title: 'Search',
        position: 'left',
        visible: false,
        size: 250,
        minSize: 150,
        maxSize: 500,
        order: 1,
      },
      {
        id: 'git',
        title: 'Source Control',
        position: 'left',
        visible: false,
        size: 250,
        minSize: 150,
        maxSize: 500,
        order: 2,
      },
      {
        id: 'terminal',
        title: 'Terminal',
        position: 'bottom',
        visible: false,
        size: 200,
        minSize: 100,
        maxSize: 600,
        order: 0,
      },
      {
        id: 'problems',
        title: 'Problems',
        position: 'bottom',
        visible: false,
        size: 200,
        minSize: 100,
        maxSize: 600,
        order: 1,
      },
      {
        id: 'output',
        title: 'Output',
        position: 'bottom',
        visible: false,
        size: 200,
        minSize: 100,
        maxSize: 600,
        order: 2,
      },
      {
        id: 'outline',
        title: 'Outline',
        position: 'right',
        visible: false,
        size: 250,
        minSize: 150,
        maxSize: 500,
        order: 0,
      },
    ];

    defaultPanels.forEach(panel => {
      this.panels.set(panel.id, panel);
    });
  }

  /**
   * Reset layout to defaults
   */
  resetLayout(): void {
    this.panels.clear();
    this.initializeDefaultPanels();
    this.saveLayout();
    this.notifyListeners();
    console.log('[PanelManager] Layout reset to defaults');
  }

  /**
   * Export layout configuration
   */
  exportLayout(): string {
    return JSON.stringify({
      panels: this.getAllPanels(),
    }, null, 2);
  }

  /**
   * Import layout configuration
   */
  importLayout(json: string): boolean {
    try {
      const layout: PanelLayout = JSON.parse(json);
      this.panels.clear();
      layout.panels.forEach(panel => {
        this.panels.set(panel.id, panel);
      });
      this.saveLayout();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('[PanelManager] Failed to import layout:', error);
      return false;
    }
  }

  /**
   * Shutdown the panel manager
   */
  shutdown(): void {
    console.log('[PanelManager] Shutting down');
    this.saveLayout();
    this.changeListeners.clear();
  }
}

/**
 * Global panel manager instance
 */
export const panelManager = new PanelManager();
