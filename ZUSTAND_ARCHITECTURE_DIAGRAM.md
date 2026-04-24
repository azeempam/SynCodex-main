# Zustand File Store - Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   ZUSTAND STORE (useFileStore)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STATE:                                                           │
│  ├─ openFolders: ['folder-1', 'folder-2', 'folder-3']          │
│  ├─ activeFileId: 'file-456' | null                             │
│  ├─ fileTree: { children: [...] }                               │
│  ├─ contextMenu: { visible, x, y, target }                      │
│  ├─ renamingItem: { id, name } | null                           │
│  ├─ loading: boolean                                             │
│  └─ error: string | null                                        │
│                                                                   │
│  ACTIONS:                                                        │
│  ├─ Folder Ops: toggleFolder, expandFolder, collapseFolder      │
│  ├─ File Ops: setActiveFile, setFileTree                        │
│  ├─ Tree Ops: addFile, addFolder, deleteNode, renameNode        │
│  ├─ Menu Ops: showContextMenu, hideContextMenu                  │
│  ├─ UI Ops: setRenamingItem, setLoading, setError               │
│  └─ Utilities: expandAll, collapseAll                           │
│                                                                   │
│  MIDDLEWARE:                                                     │
│  └─ devtools(): Redux DevTools integration                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
         ↑              ↑              ↑              ↑
         │              │              │              │
    Subscription    Subscription   Subscription  Subscription
         │              │              │              │
         ↓              ↓              ↓              ↓
    ┌────────┐   ┌──────────────┐  ┌──────────────┐  ┌─────────┐
    │FileTree│   │FileExplorer  │  │FileContext   │  │Socket   │
    │Node    │   │              │  │Menu          │  │Hook     │
    └────────┘   └──────────────┘  └──────────────┘  └─────────┘
```

---

## 📊 Component Interaction Flow

```
User Clicks File in FileTreeNode
│
├─→ handleSelect() callback triggered
│   
└─→ TWO actions happen:
    │
    ├─① setActiveFile(node.id)        [→ Store State Update]
    │   └─→ store.activeFileId = node.id
    │       └─→ All subscribed components re-render
    │
    └─② onFileSelect?.(node)            [→ Parent Handler]
        └─→ External callback (optional)
```

---

## 🔄 Folder Toggle Flow

```
User Clicks Chevron on Folder
│
└─→ handleToggle(e, folderId)
    │
    └─→ toggleFolder(folderId)         [→ Store State Update]
        │
        ├─ Check: openFolders.includes(folderId)?
        │
        ├─ YES: Remove from array
        │   openFolders = [id1, id2]  →  [id1]     (COLLAPSE)
        │
        └─ NO: Add to array
            openFolders = [id1]  →  [id1, id3]    (EXPAND)
                │
                └─→ All subscribed components re-render
                    │
                    └─→ FileTreeNode checks: openFolders.includes(nodeId)?
                        ├─ YES: Render children
                        └─ NO: Hide children
```

---

## 🎨 Component Subscription Model

```
┌─────────────────────────────────────────────────┐
│         ZUSTAND STORE (Central State)            │
└─────────────────────────────────────────────────┘
         ↑           ↑          ↑          ↑
         │           │          │          │
    PULL when    PULL when  PULL when  PULL when
    needed       needed     needed     needed
         │           │          │          │
         ↓           ↓          ↓          ↓
   ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────┐
   │FileTree │ │FileExpl  │ │Context │ │Socket│
   │Node     │ │orer      │ │Menu    │ │Hook  │
   │         │ │          │ │        │ │      │
   │Uses:    │ │Uses:     │ │Uses:   │ │Uses: │
   │openFlds │ │fileTree  │ │contMnu │ │all   │
   │activeFl │ │contMnu   │ │hide    │ │file  │
   │toggleFd │ │expandAll │ │rename  │ │opts  │
   │setActFl │ │collapAll │ │        │ │      │
   └─────────┘ └──────────┘ └────────┘ └──────┘
```

---

## 🔀 File Selection State Flow - Detailed

```
┌──────────────────────────────────────────────────────────────┐
│ INITIAL STATE: activeFileId = null                           │
└──────────────────────────────────────────────────────────────┘
                              │
                    [User clicks file.js]
                              │
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ BEFORE: activeFileId = null                                  │
│         All files: default styling                           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ↓
               setActiveFile('file.js')
                              │
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ SET in Store:                                                │
│   activeFileId = 'file.js'                                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ↓
          [Zustand: Notify all subscribers]
                              │
         ┌────────┬───────────┴──────┬──────────┐
         ↓        ↓                  ↓          ↓
    FileTree   FileExplorer   FileContextMenu   Others
      Node
             (Re-render check)
             │
         [FOR EACH NODE]:
         ├─ isActive = (activeFileId === node.id)
         │
         ├─ IF isActive = true:
         │  └─ Apply className: 'bg-blue-600 text-white'
         │
         └─ IF isActive = false:
            └─ Apply className: 'hover:bg-gray-700'
                              │
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ FINAL STATE: activeFileId = 'file.js'                        │
│              file.js: HIGHLIGHTED (blue background)          │
│              other files: default styling                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📈 Folder Expansion Tree Example

```
STARTING STATE:
openFolders = ['src']

FileTree:
├─ src/                          [FOLDER, ID: 'src', EXPANDED]
│  ├─ components                 [FOLDER, ID: 'src-comp', NOT in openFolders]
│  │  └─ (hidden)
│  ├─ utils                      [FOLDER, ID: 'src-util', NOT in openFolders]
│  │  └─ (hidden)
│  └─ index.js                   [FILE]
└─ package.json                  [FILE]


USER ACTION: Click chevron to expand 'components'

toggleFolder('src-comp')
  └─→ openFolders = ['src', 'src-comp']


UPDATED STATE:
openFolders = ['src', 'src-comp']

FileTree:
├─ src/                          [FOLDER, EXPANDED: yes (in array)]
│  ├─ components                 [FOLDER, EXPANDED: yes (in array)]
│  │  ├─ Button.jsx              [FILE] ← NOW VISIBLE
│  │  ├─ Modal.jsx               [FILE] ← NOW VISIBLE
│  │  └─ Header.jsx              [FILE] ← NOW VISIBLE
│  ├─ utils                      [FOLDER, EXPANDED: no (not in array)]
│  │  └─ (hidden)
│  └─ index.js                   [FILE]
└─ package.json                  [FILE]


USER ACTION: Click chevron again to collapse 'components'

toggleFolder('src-comp')
  └─→ openFolders = ['src']  (removed 'src-comp')


BACK TO STARTING STATE:
openFolders = ['src']
```

---

## 🔌 Action Dispatch Example

```
┌────────────────────────────────────────────────────┐
│ Single Action Dispatch Example                     │
└────────────────────────────────────────────────────┘

User Action
    │
    └─→ toggleFolder('folder-123')
        │
        ├─→ Get current state:
        │   const openFolders = get().openFolders
        │   // = ['src', 'utils']
        │
        ├─→ Check membership:
        │   openFolders.includes('folder-123')
        │   // = false (not in array)
        │
        ├─→ Add to array (expand):
        │   set({
        │     openFolders: [...openFolders, 'folder-123']
        │     // = ['src', 'utils', 'folder-123']
        │   })
        │
        └─→ Zustand batch update
            │
            ├─ Internal state updated
            ├─ Subscribers notified
            ├─ Components subscribed to openFolders re-render
            └─ DOM updated with new tree structure
```

---

## 🎯 Selector Pattern (Advanced)

```
// Get entire state
const store = useFileStore();
// → Re-renders on ANY state change

// Get specific properties
const { openFolders, activeFileId } = useFileStore();
// → Re-renders only when these specific values change

// Get nested state
const contextMenu = useFileStore(state => state.contextMenu);
// → Re-renders only when contextMenu changes

// Get computed value
const isAnyFolderOpen = useFileStore(
  state => state.openFolders.length > 0
);
// → Re-renders only when computed value changes
```

---

## 🔍 Redux DevTools Timeline

```
State Evolution Example:

[INIT] { openFolders: [], activeFileId: null }
    │
    ├─ Action: setFileTree
    │  └─→ { openFolders: [], activeFileId: null, fileTree: {...} }
    │
    ├─ Action: expandFolder('src')
    │  └─→ { openFolders: ['src'], activeFileId: null, fileTree: {...} }
    │
    ├─ Action: expandFolder('src-comp')
    │  └─→ { openFolders: ['src', 'src-comp'], activeFileId: null, ... }
    │
    ├─ Action: setActiveFile('Button.jsx')
    │  └─→ { openFolders: ['src', 'src-comp'], activeFileId: 'Button.jsx', ... }
    │
    └─ Action: collapseFolder('src-comp')
       └─→ { openFolders: ['src'], activeFileId: 'Button.jsx', ... }
```

---

## 📱 Component Render Optimization

```
FileTreeNode Component (with React.memo)

SCENARIO 1: Parent's openFolders changed
├─ Check custom comparison:
│  ├─ node === node? YES
│  ├─ level === level? YES
│  ├─ handlers === handlers? YES
│  └─ → MEMOIZED (no re-render)
│
└─ But component has direct store subscription:
   ├─ const isExpanded = openFolders.includes(node.id)
   │  └─ HAS CHANGED
   │
   └─ → RE-RENDER (store subscription bypasses memo)

SCENARIO 2: Sibling file's activeFileId changed
├─ Check custom comparison:
│  ├─ node === node? YES
│  ├─ level === level? YES
│  ├─ handlers === handlers? YES
│  └─ → MEMOIZED (no re-render)
│
└─ Component store subscription:
   ├─ const isActive = activeFileId === node.id
   │  └─ HAS CHANGED (my file is active now!)
   │
   └─ → RE-RENDER (store subscription triggers)
```

---

## 🎪 Complete User Journey Example

```
SCENARIO: User opens folder structure to find and select a file

STEP 1: Initial Load
Status: openFolders=[], activeFileId=null
Action: fetchFileTree()
Result: setFileTree(tree) → store updated

STEP 2: User clicks folder chevron "src"
Status: openFolders=['src'], activeFileId=null
Action: toggleFolder('src')
Result: "src" children now visible

STEP 3: User clicks folder chevron "components"  
Status: openFolders=['src','src-comp'], activeFileId=null
Action: toggleFolder('src-comp')
Result: "components" children now visible

STEP 4: User clicks on "Button.jsx" file
Status: openFolders=['src','src-comp'], activeFileId='Button.jsx'
Action: setActiveFile('Button.jsx')
Result: Button.jsx highlighted, ready for editing

STEP 5: User clicks on "Modal.jsx" file
Status: openFolders=['src','src-comp'], activeFileId='Modal.jsx'
Action: setActiveFile('Modal.jsx')
Result: Button.jsx unhighlighted, Modal.jsx highlighted

Redux DevTools Shows:
1️⃣ setFileTree
2️⃣ toggleFolder('src')
3️⃣ toggleFolder('src-comp')
4️⃣ setActiveFile('Button.jsx')
5️⃣ setActiveFile('Modal.jsx')
```

---

## 🛠️ Debugging Flow

```
PROBLEM: File is not highlighted when clicked

DEBUGGING STEPS:

Step 1: Check Redux DevTools
├─ Look at Action tab
├─ Verify setActiveFile was dispatched
└─ Check if activeFileId in State tab changed

Step 2: Check Component Renders
├─ Open React DevTools Profiler
├─ Click file
├─ Look for FileTreeNode component re-renders
└─ Check if activeFileId was in the render

Step 3: Check Store Subscription
├─ Add console.log in FileTreeNode:
│  const isActive = activeFileId === node.id;
│  console.log('isActive:', isActive, 'activeFileId:', activeFileId);
└─ Verify values match expected

Step 4: Check CSS
├─ Verify CSS class is applied:
│  className={isActive ? 'bg-blue-600' : 'default'}
└─ Check browser DevTools → Elements tab

Step 5: Check onClick Handler
├─ Add console.log to handleSelect:
│  console.log('Clicking:', node.id);
│  console.log('Is folder?', isFolder);
└─ Verify file clicks trigger (not folder clicks)
```

---

## 📋 Summary

This architecture provides:
✅ Single source of truth (Zustand store)
✅ Centralized state management (no props drilling)
✅ Efficient updates (only affected components re-render)
✅ Easy debugging (Redux DevTools integration)
✅ Clean component code (no state management logic)
✅ Scalability (easy to add more features)
