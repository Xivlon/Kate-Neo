# Kate IDE-Inspired Code Editor - Design Guidelines

## Design Approach

**Reference-Based: Replit + Modern Developer Tools**
Primary inspiration from Replit's clean, functional interface combined with VS Code's editor ergonomics and Linear's refined UI polish. Focus on maximizing code visibility while maintaining intuitive navigation and file management.

**Core Design Principles:**
- Code-first: Editor content is the hero - UI chrome stays minimal and functional
- Spatial consistency: Predictable zones for file navigation, editing, and output
- Information density: Optimize for professional developer workflows without clutter
- Progressive disclosure: Advanced features accessible but not overwhelming

---

## Typography System

**Font Families:**
- **UI Text**: Inter (via Google Fonts) - navigation, buttons, labels, dialogs
- **Code/Monospace**: JetBrains Mono (via Google Fonts) - all editor content, file names, terminal

**Type Scale:**
- **Editor content**: 14px base (customizable by user preference)
- **UI labels**: 13px (file names, tab titles, sidebar items)
- **Section headers**: 12px uppercase, medium weight (sidebar sections)
- **Button text**: 14px medium weight
- **Line numbers**: 12px, reduced opacity

**Hierarchy Rules:**
- Active items: Medium weight (500)
- Inactive items: Regular weight (400)
- Headers/labels: Medium weight (500), uppercase for sidebar sections

---

## Layout System

**Spacing Primitives:**
Use Tailwind units: **2, 3, 4, 6, 8** for consistent rhythm
- Tight spacing (tabs, buttons): p-2, gap-2
- Standard padding (sidebar items, modals): p-4
- Section separation: py-6, py-8
- Panel padding: p-6

**Three-Pane Layout Structure:**

```
┌─────────────────────────────────────────────────┐
│ Top Menu Bar (h-12)                             │
├──────────┬─────────────────────────┬────────────┤
│          │ Tab Bar (h-10)          │            │
│ Sidebar  ├─────────────────────────┤  Output    │
│ (w-64)   │                         │  Panel     │
│          │   Editor Area           │  (w-80)    │
│ Tree     │   (flex-1)              │  (optional)│
│ View     │                         │            │
│          │                         │            │
└──────────┴─────────────────────────┴────────────┘
```

**Responsive Breakpoints:**
- Mobile (<768px): Stack vertically, collapsible sidebar overlay
- Tablet (768px-1024px): Sidebar + editor only, hide output panel
- Desktop (>1024px): Full three-pane layout with resizable splitters

**Panel Constraints:**
- Sidebar: min-w-48, max-w-80, default w-64
- Output panel: min-w-64, max-w-96, default w-80
- Editor: Always flex-1 to fill remaining space

---

## Component Library

### Top Menu Bar
**Structure:** Fixed height (h-12), full-width horizontal flex container
- Left section: Logo/app name (text-base, font-medium)
- Center section: Global actions (New File, Open, Save) as icon buttons with tooltips
- Right section: Settings icon, user menu, theme toggle
- **Spacing:** px-4, gap-3 between elements

### File Explorer Sidebar
**Tree Structure:**
- Collapsible folder items with chevron icons (right-pointing collapsed, down-pointing expanded)
- File items indented by pl-6 per nesting level
- Item height: h-8 for comfortable click targets
- Hover state with subtle background change
- Selected file with distinct background treatment

**File Icons:** Use file type icons from VS Code icon set or Material Icons
- Folder icons: chevron-right/down rotation
- File extensions determine icon (c, cpp, sql, replicode custom)

**Interaction:** 
- Single click to select and open file
- Right-click context menu for rename/delete operations
- Drag handle for resizing sidebar width

### Tab Bar
**Layout:** Horizontal scrollable container (overflow-x-auto) with h-10 fixed height
- Tab item: px-4, h-full, inline-flex items-center gap-2
- Close button: Small X icon (w-4 h-4) on hover, always visible on active tab
- Modified indicator: Small dot before filename for unsaved changes
- **Max tabs visible:** Scroll with arrow buttons at edges if overflowing

**Tab States:**
- Active: Distinct bottom border (h-0.5), medium font weight
- Inactive: Regular weight, reduced opacity
- Hover: Subtle background change, close button appears

### Monaco Editor Integration
**Configuration:**
- Line numbers: Always visible, right-aligned, pl-3 from left edge
- Minimap: Visible on desktop (>1280px), hidden on smaller screens
- Scrollbar: Custom styled to match theme, thinner than default (w-2)
- Gutter width: w-12 for line numbers + breakpoint area

**Editor Chrome:**
- Breadcrumb navigation above editor (file path) - h-8, px-4, text-xs
- Status bar below editor (line/col, language, encoding) - h-7, px-4, text-xs

### Output/Terminal Panel
**Structure:** Vertically split with tabs for Output, Terminal, Problems
- Tab switcher: h-8, text-xs uppercase, gap-4
- Content area: Monospace font, scrollable, p-4
- Resize handle on left edge for width adjustment
- Toggle visibility button in tab bar

### Modals & Dialogs

**Find/Replace Dialog:**
- Floating overlay positioned near top-right of editor
- Width: w-96, rounded corners, shadow-xl
- Input fields: h-10, w-full, with icon prefixes
- Action buttons: Horizontal row, gap-2, h-8
- Close button: Top-right corner

**Color Picker:**
- Inline overlay triggered by clicking hex color in editor
- Compact design: w-64, includes hex input + visual picker
- Positioned adjacent to hex code in document (absolute positioning)
- Auto-dismiss on click outside

**Context Menus:**
- Minimal width (w-48), max-height with scroll if needed
- Menu items: h-9, px-3, text-sm
- Keyboard shortcuts right-aligned in lighter text
- Dividers between logical groups (border-t, my-1)

### Buttons & Controls

**Primary Actions:**
- Height: h-9
- Padding: px-4
- Border radius: rounded-md
- Icon + text or icon-only variants

**Icon Buttons:**
- Size: w-8 h-8
- Icon size: w-5 h-5
- Centered content

**Toggle Switches:** 
- Use for settings (line numbers, minimap, word wrap)
- Standard size: w-11 h-6

---

## Icon System

**Icon Library:** Heroicons (outline style for UI, solid for active states)
- Menu/navigation: 20px (w-5 h-5)
- Inline actions: 16px (w-4 h-4)
- File type icons: 18px (w-4.5 h-4.5)

**Common Icons:**
- File operations: document-plus, folder-plus, trash, pencil
- Editor: magnifying-glass, arrow-path, clipboard
- UI controls: x-mark, chevron-right, chevron-down, bars-3

---

## Interaction Patterns

**Keyboard Shortcuts:**
- Display shortcuts in tooltips and context menus
- Standard IDE shortcuts (Ctrl+S, Ctrl+F, Ctrl+W for tabs)
- Shortcut hints in light, monospace text

**Drag & Drop:**
- Tab reordering: Visual indicator during drag
- File tree reorganization (future enhancement placeholder)

**Resizable Panels:**
- Drag handles: w-1 between panels, cursor-col-resize
- Hover state on handles for discoverability
- Double-click handle to reset to default size

**Loading States:**
- File opening: Skeleton loader in editor area
- Large file syntax highlighting: Progress indicator in status bar

---

## Accessibility

**Focus Management:**
- Visible focus rings on all interactive elements (ring-2, ring-offset-2)
- Tab navigation through file tree, tabs, editor, and panels
- Skip to main content link for keyboard users

**ARIA Labels:**
- File tree: aria-label for folders/files with full path
- Tab bar: aria-label with filename and modified state
- Editor: Properly labeled region with file name

**Contrast:**
- All text meets WCAG AA standards for readability
- Interactive elements have clear visual distinction

---

## Animation Guidelines

**Minimal Motion Philosophy:**
Use animations sparingly - code editors need stability, not distraction.

**Allowed Animations:**
- Sidebar collapse/expand: 200ms ease-in-out width transition
- Tab switching: Instant, no transition
- Context menu appearance: 150ms fade-in
- Hover states: No transition or instant

**Forbidden:**
- Editor content animations
- Scrolling effects
- Tab reordering animations (instant snap)

---

## Images

**No hero images or decorative imagery** - This is a functional developer tool. The only visual assets are:
- File type icons (from icon library)
- Logo/branding in top menu (if applicable)
- Empty state illustrations (optional): Simple line art for empty file tree