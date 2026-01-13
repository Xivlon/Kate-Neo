import { useResponsiveSpacing } from "@/hooks/useResponsiveSpacing";
import { BREAKPOINTS } from "@/lib/spacing";

interface StatusBarProps {
  line?: number;
  column?: number;
  language?: string;
  encoding?: string;
}

export function StatusBar({ line = 1, column = 1, language = "plaintext", encoding = "UTF-8" }: StatusBarProps) {
  // Dynamic spacing based on container width
  const { containerRef, dimensions, isCompact } = useResponsiveSpacing({
    debounceDelay: 50,
  });

  // Determine layout based on available width
  const isNarrow = dimensions.width > 0 && dimensions.width < BREAKPOINTS.sm;
  const isVeryNarrow = dimensions.width > 0 && dimensions.width < 300;

  // Dynamic spacing classes
  const containerPadding = isCompact ? 'px-2' : 'px-4';
  const itemGap = isCompact ? 'gap-2' : 'gap-4';

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`h-7 flex items-center justify-between ${containerPadding} bg-card border-t border-card-border text-xs min-w-0`}
      data-testid="status-bar"
    >
      <div className={`flex items-center ${itemGap} min-w-0 flex-shrink`}>
        <span className="font-mono text-muted-foreground whitespace-nowrap">
          {isVeryNarrow ? `${line}:${column}` : `Ln ${line}, Col ${column}`}
        </span>
      </div>
      <div className={`flex items-center ${itemGap} min-w-0 flex-shrink-0`}>
        {/* Hide encoding on very narrow screens */}
        {!isNarrow && (
          <span className="text-muted-foreground whitespace-nowrap">{encoding}</span>
        )}
        <span className="text-muted-foreground capitalize whitespace-nowrap truncate max-w-24">
          {language}
        </span>
      </div>
    </div>
  );
}
