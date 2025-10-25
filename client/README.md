# Client (Frontend)

This directory contains the React-based frontend application for Kate Neo.

## Key Files for Kate Integration

### `src/components/KateEditorPanel.tsx`
Placeholder component for Kate text editor integration. This component will eventually replace Monaco Editor with the Kate engine.

**Current Status**: Placeholder mode - displays information about planned Kate integration

**TODO Integration Points**:
- Initialize connection to Kate engine bridge via WebSocket
- Implement bidirectional buffer synchronization
- Map Kate syntax highlighting to Monaco/Theia format
- Integrate Kate's code folding markers
- Add Kate session management hooks
- Implement Kate command palette integration

**Features to be Implemented**:
- Advanced syntax highlighting using Kate's engine
- Intelligent code folding
- Smart indentation
- Powerful search and replace
- Session management and recovery
- Multi-cursor support
- Bracket matching
- Auto-completion

## Current Implementation

The frontend currently uses Monaco Editor as a placeholder until the Kate engine integration is complete. The `KateEditorPanel` component demonstrates where the Kate integration will occur.

## Development

```bash
# From repository root
npm run dev
```

This starts both the frontend and backend in development mode with hot reloading.

## Structure

```
client/
├── src/
│   ├── components/
│   │   ├── KateEditorPanel.tsx  ← Kate integration placeholder
│   │   ├── CodeEditor.tsx       ← Main editor page
│   │   └── ...                  ← Other UI components
│   ├── hooks/
│   │   ├── use-toast.ts         ← Toast notifications
│   │   └── use-mobile.ts        ← Mobile detection
│   ├── lib/
│   ├── pages/
│   └── App.tsx
├── public/
└── index.html
```

## Next Steps

1. Research Eclipse Theia panel system integration
2. Design WebSocket protocol for Kate bridge communication
3. Implement connection management
4. Add buffer synchronization logic
5. Map Kate syntax highlighting to Monaco tokenizer

For more details, see the main [README.md](../README.md) in the repository root.
