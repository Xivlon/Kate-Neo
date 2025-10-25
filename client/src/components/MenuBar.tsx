import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

export function MenuBar() {
  return (
    <Menubar className="border-0 bg-transparent" data-testid="menu-bar">
      <MenubarMenu>
        <MenubarTrigger className="text-xs">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New File <MenubarShortcut>Ctrl+N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open <MenubarShortcut>Ctrl+O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Save As <MenubarShortcut>Ctrl+Shift+S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Close File</MenubarItem>
          <MenubarItem>Close All</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Cut <MenubarShortcut>Ctrl+X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Find <MenubarShortcut>Ctrl+F</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Replace <MenubarShortcut>Ctrl+H</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Selection</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Select All <MenubarShortcut>Ctrl+A</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>Expand Selection</MenubarItem>
          <MenubarItem>Shrink Selection</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Toggle Sidebar</MenubarItem>
          <MenubarItem>Toggle Output</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Zoom In</MenubarItem>
          <MenubarItem>Zoom Out</MenubarItem>
          <MenubarItem>Reset Zoom</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Go</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Go to Line <MenubarShortcut>Ctrl+G</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>Go to File</MenubarItem>
          <MenubarItem>Go to Symbol</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Projects</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Open Project</MenubarItem>
          <MenubarItem>Close Project</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Project Settings</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">LSP Client</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Restart Server</MenubarItem>
          <MenubarItem>Show Diagnostics</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Go to Definition</MenubarItem>
          <MenubarItem>Find References</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Build</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Build <MenubarShortcut>F7</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>Rebuild</MenubarItem>
          <MenubarItem>Clean</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Run</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">SQL</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Execute Query</MenubarItem>
          <MenubarItem>New Connection</MenubarItem>
          <MenubarItem>Close Connection</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">XML</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Format XML</MenubarItem>
          <MenubarItem>Validate</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Sessions</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Save Session</MenubarItem>
          <MenubarItem>Load Session</MenubarItem>
          <MenubarItem>Manage Sessions</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Tools</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Color Picker</MenubarItem>
          <MenubarItem>External Tools</MenubarItem>
          <MenubarItem>Terminal</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Settings</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Preferences</MenubarItem>
          <MenubarItem>Editor Settings</MenubarItem>
          <MenubarItem>Keyboard Shortcuts</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="text-xs">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Documentation</MenubarItem>
          <MenubarItem>Keyboard Shortcuts</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>About</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
