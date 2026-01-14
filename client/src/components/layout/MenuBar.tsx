import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarCheckboxItem,
} from "@/components/ui/menubar";

export interface MenuBarProps {
  // File menu
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onSave?: () => void;
  onCloseFile?: () => void;
  onCloseAllFiles?: () => void;

  // Edit menu
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onSelectAll?: () => void;

  // View menu
  onToggleSidebar?: () => void;
  onToggleTerminal?: () => void;
  sidebarVisible?: boolean;
  terminalVisible?: boolean;

  // Go menu
  onGoToLine?: () => void;
  onGoToFile?: () => void;

  // Tools menu
  onOpenTerminal?: () => void;

  // Settings menu
  onOpenSettings?: () => void;

  // Help menu
  onShowAbout?: () => void;
  onShowKeyboardShortcuts?: () => void;
}

export function MenuBar({
  onNewFile,
  onNewFolder,
  onSave,
  onCloseFile,
  onCloseAllFiles,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onFind,
  onReplace,
  onSelectAll,
  onToggleSidebar,
  onToggleTerminal,
  sidebarVisible = true,
  terminalVisible = false,
  onGoToLine,
  onGoToFile,
  onOpenTerminal,
  onOpenSettings,
  onShowAbout,
  onShowKeyboardShortcuts,
}: MenuBarProps) {
  return (
    <Menubar className="border-0 bg-transparent" data-testid="menu-bar">
      <MenubarMenu>
        <MenubarTrigger className="text-xs">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onNewFile}>
            New File <MenubarShortcut>Ctrl+N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onNewFolder}>
            New Folder
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onSave}>
            Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onCloseFile}>
            Close File
          </MenubarItem>
          <MenubarItem onClick={onCloseAllFiles}>
            Close All
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onUndo}>
            Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onRedo}>
            Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onCut}>
            Cut <MenubarShortcut>Ctrl+X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onCopy}>
            Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onPaste}>
            Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onSelectAll}>
            Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onFind}>
            Find <MenubarShortcut>Ctrl+F</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onReplace}>
            Replace <MenubarShortcut>Ctrl+H</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem
            checked={sidebarVisible}
            onClick={onToggleSidebar}
          >
            Sidebar <MenubarShortcut>Ctrl+B</MenubarShortcut>
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={terminalVisible}
            onClick={onToggleTerminal}
          >
            Terminal <MenubarShortcut>Ctrl+`</MenubarShortcut>
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Go</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onGoToLine}>
            Go to Line <MenubarShortcut>Ctrl+G</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onGoToFile}>
            Go to File <MenubarShortcut>Ctrl+P</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Tools</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onOpenTerminal}>
            Terminal <MenubarShortcut>Ctrl+`</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Settings</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onOpenSettings}>
            Preferences <MenubarShortcut>Ctrl+,</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onClick={onShowKeyboardShortcuts}>
            Keyboard Shortcuts
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onShowKeyboardShortcuts}>
            Keyboard Shortcuts
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={onShowAbout}>
            About
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
