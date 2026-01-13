import { FilePlus, FolderPlus, Save, Search, Settings, Github, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import logoUrl from "@assets/Fennec-removebg-light.png";
import { MenuBar } from "./MenuBar";
import { useResponsiveSpacing } from "@/hooks/useResponsiveSpacing";
import { BREAKPOINTS } from "@/lib/spacing";

interface TopMenuBarProps {
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onSave?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onGithubConnect?: () => void;
}

export function TopMenuBar({
  onNewFile,
  onNewFolder,
  onSave,
  onSearch,
  onSettings,
  onGithubConnect,
}: TopMenuBarProps) {
  // Dynamic spacing based on container width
  const { containerRef, dimensions, isCompact } = useResponsiveSpacing({
    debounceDelay: 50,
  });

  // Determine if we should collapse toolbar items into a menu
  const shouldCollapseToolbar = dimensions.width > 0 && dimensions.width < BREAKPOINTS.md;
  // Hide logo text when very narrow
  const isVeryNarrow = dimensions.width > 0 && dimensions.width < BREAKPOINTS.sm;

  // Dynamic spacing classes
  const containerPadding = isCompact ? 'px-2' : 'px-3';
  const itemGap = isCompact ? 'gap-1' : 'gap-2';
  const logoSize = isVeryNarrow ? 'h-8' : 'h-12';

  // Toolbar action items
  const toolbarItems = [
    { icon: FilePlus, label: 'New File (Ctrl+N)', onClick: onNewFile, testId: 'button-new-file' },
    { icon: FolderPlus, label: 'New Folder', onClick: onNewFolder, testId: 'button-new-folder' },
    { icon: Save, label: 'Save (Ctrl+S)', onClick: onSave, testId: 'button-save' },
    { icon: Search, label: 'Find (Ctrl+F)', onClick: onSearch, testId: 'button-search' },
  ];

  const renderToolbarButton = (item: typeof toolbarItems[0], compact: boolean = false) => (
    <Tooltip key={item.testId}>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={item.onClick}
          className={compact ? "h-7 w-7" : "h-8 w-8"}
          data-testid={item.testId}
        >
          <item.icon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{item.label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className="flex flex-col">
      {/* Main header row */}
      <div className={`h-13 flex items-center justify-between ${containerPadding} border-b border-card-border min-w-0`}>
        <div className={`flex items-center ${itemGap} min-w-0 flex-1`}>
          <img
            src={logoUrl}
            alt="IDE Logo"
            className={`${logoSize} w-auto flex-shrink-0 transition-all duration-150`}
          />
          {!isVeryNarrow && <MenuBar />}
        </div>

        <div className={`flex items-center ${itemGap} flex-shrink-0`}>
          {/* Show MenuBar in overflow on very narrow screens */}
          {isVeryNarrow && <MenuBar />}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onSettings}
                className={isCompact ? "h-5 w-5" : "h-6 w-6"}
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Toolbar row */}
      <div className={`h-10 flex items-center ${containerPadding} ${itemGap} min-w-0`}>
        {shouldCollapseToolbar ? (
          /* Collapsed toolbar - show overflow menu */
          <>
            {/* Always show first two most important actions */}
            {toolbarItems.slice(0, 2).map((item) => renderToolbarButton(item, true))}

            {/* Overflow menu for remaining items */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  data-testid="toolbar-overflow-menu"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {toolbarItems.slice(2).map((item) => (
                  <DropdownMenuItem
                    key={item.testId}
                    onClick={item.onClick}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onGithubConnect}
                  className="flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  <span>Connect to GitHub</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          /* Full toolbar */
          <>
            {toolbarItems.map((item) => renderToolbarButton(item))}

            <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onGithubConnect}
                  className="h-8 w-8"
                  data-testid="button-github-connect"
                >
                  <Github className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Connect to GitHub Repository</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
