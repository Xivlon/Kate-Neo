import { X, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Tab {
  id: string;
  name: string;
  isDirty?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId?: string;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose }: TabBarProps) {
  return (
    <div className="h-10 flex items-center bg-card border-b border-card-border overflow-x-auto" data-testid="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`h-full px-4 flex items-center gap-2 cursor-pointer border-r border-card-border hover-elevate ${
            activeTabId === tab.id
              ? "bg-background border-b-2 border-b-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => onTabSelect(tab.id)}
          data-testid={`tab-${tab.id}`}
        >
          {tab.isDirty && <Circle className="w-2 h-2 fill-current" />}
          <span className="text-xs font-mono whitespace-nowrap">{tab.name}</span>
          <Button
            size="icon"
            variant="ghost"
            className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            data-testid={`button-close-tab-${tab.id}`}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
