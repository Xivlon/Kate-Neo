import { FilePlus, FolderPlus, Save, Search, Settings, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import logoUrl from "@assets/Fennec-removebg-light_1761405012436.png";
import { MenuBar } from "./MenuBar";

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
  return (
 <div className="h-13 flex items-center justify-between px-3 border-b border-card-border">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="IDE Logo" className="h-12 w-auto" />
          <MenuBar />
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onSettings}
                className="h-6 w-6"
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="h-10 flex items-center px-3 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onNewFile}
              className="h-8 w-8"
              data-testid="button-new-file"
            >
              <FilePlus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New File (Ctrl+N)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onNewFolder}
              className="h-8 w-8"
              data-testid="button-new-folder"
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Folder</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onSave}
              className="h-8 w-8"
              data-testid="button-save"
            >
              <Save className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save (Ctrl+S)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={onSearch}
              className="h-8 w-8"
              data-testid="button-search"
            >
              <Search className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Find (Ctrl+F)</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

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
      </div>
    </div>
  );
}
