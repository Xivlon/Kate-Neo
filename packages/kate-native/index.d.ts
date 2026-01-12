declare module '@kate-neo/native' {
  export class KateDocument {
    constructor();
    getText(): string;
    setText(text: string): void;
    insertText(line: number, column: number, text: string): void;
    removeText(startLine: number, startCol: number, endLine: number, endCol: number): void;
    line(lineNumber: number): string;
    readonly lineCount: number;
    setMode(mode: string): void;
    readonly mode: string;
    save(): boolean;
    readonly isModified: boolean;
    
    // Events
    on(event: 'textChanged', callback: () => void): void;
    on(event: 'modeChanged', callback: (mode: string) => void): void;
  }
  
  export const version: string;
  export function isKateAvailable(): boolean;
}
