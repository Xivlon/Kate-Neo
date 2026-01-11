/**
 * Command Palette - Quick access to IDE commands and features
 * 
 * Provides a searchable command palette for executing IDE actions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Command {
  id: string;
  label: string;
  description?: string;
  category?: string;
  keybinding?: string;
  action: () => void | Promise<void>;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
}

/**
 * Command Palette Component
 * 
 * Keyboard-driven command execution interface
 */
export function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.category?.toLowerCase().includes(searchLower)
    );
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Update selected index when filtered results change
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // Execute selected command
  const executeCommand = useCallback(async () => {
    if (filteredCommands[selectedIndex]) {
      const command = filteredCommands[selectedIndex];
      await command.action();
      onOpenChange(false);
    }
  }, [filteredCommands, selectedIndex, onOpenChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        executeCommand();
        break;
      case 'Escape':
        e.preventDefault();
        onOpenChange(false);
        break;
    }
  }, [filteredCommands.length, executeCommand, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>
            Search and execute commands
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-4">
          <Input
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="mb-4"
          />
        </div>

        <ScrollArea className="max-h-[400px] px-4 pb-4">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No commands found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, index) => (
                <div
                  key={command.id}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                  onClick={() => {
                    setSelectedIndex(index);
                    executeCommand();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {command.category && (
                        <span className="text-xs text-muted-foreground">
                          {command.category}:
                        </span>
                      )}
                      <span className="font-medium">{command.label}</span>
                    </div>
                    {command.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {command.description}
                      </div>
                    )}
                  </div>
                  {command.keybinding && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {command.keybinding}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
