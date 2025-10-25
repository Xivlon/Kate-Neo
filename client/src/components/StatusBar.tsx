interface StatusBarProps {
  line?: number;
  column?: number;
  language?: string;
  encoding?: string;
}

export function StatusBar({ line = 1, column = 1, language = "plaintext", encoding = "UTF-8" }: StatusBarProps) {
  return (
    <div className="h-7 flex items-center justify-between px-4 bg-card border-t border-card-border text-xs" data-testid="status-bar">
      <div className="flex items-center gap-4">
        <span className="font-mono text-muted-foreground">
          Ln {line}, Col {column}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">{encoding}</span>
        <span className="text-muted-foreground capitalize">{language}</span>
      </div>
    </div>
  );
}
