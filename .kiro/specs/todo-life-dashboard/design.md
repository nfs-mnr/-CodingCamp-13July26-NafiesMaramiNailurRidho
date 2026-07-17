# Design Document: To-Do Life Dashboard

## Overview

The To-Do Life Dashboard is a self-contained, single-page web application delivered as static HTML + CSS + Vanilla JavaScript. It runs entirely in the browser with no server, no build step, and no external dependencies. All state is persisted to `localStorage`.

The page is structured as four widgets arranged in a responsive grid:

- **Greeting Widget** — displays current time (24h HH:MM), date, and time-of-day greeting
- **Focus Timer** — 25-minute Pomodoro countdown with start/stop/reset
- **To-Do List** — persistent task management with CRUD operations
- **Quick Links** — persistent shortcut buttons that open URLs in new tabs

The entire application is defined by three files:

```
index.html      — semantic markup and widget scaffolding
css/style.css   — all visual styling and responsive layout
js/app.js       — all application logic (no modules, single IIFE)
```

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                   index.html                    │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │  <head>      │  │  <body>                │   │
│  │  css/style.css│  │  #dashboard-grid       │   │
│  │  js/app.js   │  │  ├─ #greeting-widget   │   │
│  └──────────────┘  │  ├─ #focus-timer       │   │
│                    │  ├─ #todo-list         │   │
│                    │  └─ #quick-links       │   │
│                    └────────────────────────┘   │
└─────────────────────────────────────────────────┘
          │                         │
          ▼                         ▼
   css/style.css               js/app.js
   (static styles)             (IIFE module)
          │                         │
          │              ┌──────────┴──────────┐
          │              │  Module Namespaces  │
          │              │  ├─ Storage         │
          │              │  ├─ Greeting        │
          │              │  ├─ FocusTimer      │
          │              │  ├─ TodoList        │
          │              │  └─ QuickLinks      │
          │              └──────────┬──────────┘
          │                         │
          ▼                         ▼
                         Browser localStorage API
```

### Module Structure in `js/app.js`

`app.js` uses a single IIFE to avoid polluting the global scope. Inside, it defines five plain-object namespaces:

```
(function () {
  const Storage    = { ... };  // localStorage read/write helpers
  const Greeting   = { ... };  // clock tick and greeting logic
  const FocusTimer = { ... };  // countdown state machine
  const TodoList   = { ... };  // task CRUD and rendering
  const QuickLinks = { ... };  // link CRUD and rendering
  
  // init
  Greeting.init();
  FocusTimer.init();
  TodoList.init();
  QuickLinks.init();
})();
```

Each namespace exposes an `init()` function called once at DOMContentLoaded. Namespaces do not reference each other except that `TodoList` and `QuickLinks` both call `Storage` helpers.

---

## Components and Interfaces

### Storage Module

Responsible for all `localStorage` interaction. All other modules call these helpers instead of touching `localStorage` directly, so error handling is centralised.

```js
Storage = {
  KEYS: {
    TASKS: 'tdld_tasks',   // "to-do life dashboard tasks"
    LINKS: 'tdld_links',
  },

  // Returns parsed value or null. Shows error notice on parse failure.
  read(key): Array | null,

  // Serializes value and writes. Shows error notice on QuotaExceededError.
  write(key, value): void,

  // Shows a non-blocking error notice in #storage-error-banner.
  showError(message): void,
}
```

**Error handling contract:**
- `read()` wraps `JSON.parse` in try/catch. On failure: returns `null` and calls `showError()`.
- `write()` wraps `localStorage.setItem` in try/catch. On failure (e.g. `QuotaExceededError`): calls `showError()` but does **not** throw — the UI state remains valid even if persistence failed.

### Greeting Module

Manages the `#greeting-widget` DOM subtree.

```js
Greeting = {
  elements: {
    time: HTMLElement,   // #greeting-time
    date: HTMLElement,   // #greeting-date
    text: HTMLElement,   // #greeting-text
  },

  init(): void,          // binds elements, calls render(), starts interval
  render(): void,        // reads Date(), updates DOM
  getGreeting(hour: number): string,  // pure — returns greeting string
  formatTime(date: Date): string,     // pure — returns "HH:MM"
  formatDate(date: Date): string,     // pure — returns locale date string
  tick(): void,          // called by setInterval every 60 000 ms
}
```

**Interval strategy:** A single `setInterval(Greeting.tick, 60_000)` is started in `init()`. The first render happens synchronously in `init()` so the correct time appears immediately on load without waiting 60 seconds.

### Focus Timer Module

Manages the `#focus-timer` DOM subtree. Uses a simple state machine.

```js
FocusTimer = {
  DURATION: 1500,        // seconds (25 minutes)

  state: {
    remaining: number,   // seconds left (0–1500)
    running: boolean,
    intervalId: number | null,
    finished: boolean,   // true when remaining hits 0
  },

  elements: {
    display: HTMLElement,  // #timer-display
    startBtn: HTMLElement, // #timer-start
    stopBtn: HTMLElement,  // #timer-stop
    resetBtn: HTMLElement, // #timer-reset
    banner: HTMLElement,   // #timer-finished-banner (hidden until finished)
  },

  init(): void,
  tick(): void,          // decrements state.remaining, called by interval
  start(): void,
  stop(): void,
  reset(): void,
  render(): void,        // updates display and button disabled states
  formatTime(seconds: number): string,  // pure — returns "MM:SS"
}
```

**State machine transitions:**

```
      ┌──────────────┐
      │   IDLE       │◄─────────── reset() ──────────────┐
      │ remaining=1500│                                    │
      │ running=false │                                    │
      └──────┬───────┘                                    │
             │ start()                                    │
             ▼                                            │
      ┌──────────────┐                                    │
      │   RUNNING    │──── stop() ───► PAUSED ──── start()┤
      │ running=true │                                    │
      └──────┬───────┘                                    │
             │ remaining reaches 0                        │
             ▼                                            │
      ┌──────────────┐                                    │
      │   FINISHED   │────────── reset() ────────────────►┘
      │ finished=true│
      └──────────────┘
```

### To-Do List Module

Manages the `#todo-list` DOM subtree. Maintains an in-memory array `tasks` that is always the source of truth; the DOM and `localStorage` are derived from it.

```js
TodoList = {
  tasks: Task[],         // in-memory collection, ordered by insertion

  elements: {
    form: HTMLFormElement,     // #todo-form
    input: HTMLInputElement,   // #todo-input
    error: HTMLElement,        // #todo-input-error
    list: HTMLElement,         // #todo-list-items  (ul)
  },

  init(): void,
  load(): void,           // reads Storage, populates this.tasks, calls render()
  render(): void,         // full re-render of #todo-list-items from this.tasks
  renderTask(task: Task): HTMLElement,  // creates one <li> for a task
  save(): void,           // calls Storage.write with current this.tasks

  add(description: string): void,
  beginEdit(id: string): void,
  saveEdit(id: string, description: string): void,
  cancelEdit(id: string): void,
  toggleDone(id: string): void,
  delete(id: string): void,

  validate(description: string): string | null,  // pure — returns error message or null
  generateId(): string,   // returns crypto.randomUUID() or Date.now() fallback
}
```

**Rendering strategy:** Full re-render on every mutation. With a maximum of 500 tasks this is fast enough to stay well within the 200ms response budget. Individual `<li>` elements are not reused — `render()` clears `innerHTML` and rebuilds from `this.tasks`.

**Edit mode:** When `beginEdit(id)` is called, the task's `<li>` is replaced in-place with an edit form containing a pre-populated `<input>`. All other tasks remain in view-mode. Only one task can be in edit mode at a time (opening a second edit auto-cancels the first).

### Quick Links Module

Manages the `#quick-links` DOM subtree. Same in-memory-array pattern as `TodoList`.

```js
QuickLinks = {
  links: Link[],

  elements: {
    form: HTMLFormElement,
    labelInput: HTMLInputElement,  // #link-label-input
    urlInput: HTMLInputElement,    // #link-url-input
    labelError: HTMLElement,       // #link-label-error
    urlError: HTMLElement,         // #link-url-error
    container: HTMLElement,        // #link-buttons  (div)
  },

  init(): void,
  load(): void,
  render(): void,
  renderLink(link: Link): HTMLElement,  // creates one <button> + delete <button>
  save(): void,

  add(label: string, url: string): void,
  delete(id: string): void,

  validateLabel(label: string): string | null,
  validateUrl(url: string): string | null,
}
```

**Link button rendering:** Each link renders as a pair: an `<a>` element styled as a button (label text, `target="_blank"`, `rel="noopener noreferrer"`) and an adjacent small delete `<button>`.

---

## Data Models

### Task Object

```js
/**
 * @typedef {Object} Task
 * @property {string}  id          - Unique identifier (UUID or timestamp string)
 * @property {string}  description - Task text, 1–200 characters (stored trimmed)
 * @property {boolean} done        - Completion status
 * @property {number}  createdAt   - Unix timestamp ms (Date.now() at creation)
 */
```

Example:
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "description": "Review pull request for auth module",
  "done": false,
  "createdAt": 1721224800000
}
```

### Link Object

```js
/**
 * @typedef {Object} Link
 * @property {string} id        - Unique identifier (UUID or timestamp string)
 * @property {string} label     - Display text, 1–50 characters (stored trimmed)
 * @property {string} url       - Full URL, 1–2048 characters, starts with http:// or https://
 * @property {number} createdAt - Unix timestamp ms (Date.now() at creation)
 */
```

Example:
```json
{
  "id": "3e4666bf-d5e5-4aa7-b8ce-cefe41c7568a",
  "label": "GitHub",
  "url": "https://github.com",
  "createdAt": 1721224900000
}
```

### LocalStorage Schema

| Key | Value type | Description |
|---|---|---|
| `tdld_tasks` | JSON array of `Task` | Full task collection, written on every mutation |
| `tdld_links` | JSON array of `Link` | Full link collection, written on every mutation |

**Serialization:** `JSON.stringify(array)` / `JSON.parse(string)`. No compression or encryption. The keys are prefixed with `tdld_` to avoid collisions with other applications sharing the same origin.

**Example stored values:**

```json
// localStorage["tdld_tasks"]
[
  {"id":"abc123","description":"Buy groceries","done":false,"createdAt":1721224800000},
  {"id":"def456","description":"Call dentist","done":true,"createdAt":1721225000000}
]

// localStorage["tdld_links"]
[
  {"id":"ghi789","label":"Gmail","url":"https://mail.google.com","createdAt":1721225100000}
]
```

---

## UI Layout and Responsive Design

### HTML Structure

```html
<body>
  <div id="storage-error-banner" hidden>...</div>  <!-- non-blocking error notice -->

  <main id="dashboard-grid">

    <section id="greeting-widget" class="widget">
      <p id="greeting-time">...</p>
      <p id="greeting-date">...</p>
      <h1 id="greeting-text">...</h1>
    </section>

    <section id="focus-timer" class="widget">
      <div id="timer-display">25:00</div>
      <div id="timer-finished-banner" hidden>Session complete!</div>
      <div class="timer-controls">
        <button id="timer-start">Start</button>
        <button id="timer-stop" disabled>Stop</button>
        <button id="timer-reset">Reset</button>
      </div>
    </section>

    <section id="todo-list" class="widget">
      <h2>To-Do</h2>
      <form id="todo-form">
        <input id="todo-input" type="text" maxlength="200" placeholder="Add a task…">
        <button type="submit">Add</button>
        <span id="todo-input-error" role="alert" aria-live="polite"></span>
      </form>
      <ul id="todo-list-items" aria-label="Tasks"></ul>
    </section>

    <section id="quick-links" class="widget">
      <h2>Quick Links</h2>
      <form id="link-form">
        <input id="link-label-input" type="text" maxlength="50" placeholder="Label">
        <span id="link-label-error" role="alert" aria-live="polite"></span>
        <input id="link-url-input"   type="url"  maxlength="2048" placeholder="https://…">
        <span id="link-url-error"   role="alert" aria-live="polite"></span>
        <button type="submit">Add Link</button>
      </form>
      <div id="link-buttons" aria-label="Saved links"></div>
    </section>

  </main>
</body>
```

### CSS Grid Layout

```css
/* Mobile-first base: single column */
#dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 16px;
  min-width: 0;   /* prevents overflow */
}

/* ≥768px: 2×2 grid */
@media (min-width: 768px) {
  #dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

The four `.widget` sections each occupy one grid cell. On narrow viewports they stack vertically; at 768 px+ they form a 2-column grid. The `min-width: 0` on the grid container and `overflow-x: hidden` on `body` prevent horizontal scroll at 360 px.

### Responsive Breakpoints

| Viewport | Layout |
|---|---|
| 360px – 767px | 1 column, widgets stacked |
| 768px+ | 2 columns × 2 rows grid |

### Widget Separation

Adjacent widgets have a `gap` of `16px` (satisfying the ≥16px spacing requirement). Each `.widget` also has a distinct background color with sufficient contrast against the page background, reinforcing visual separation.

### Accessibility Considerations

- Validation errors use `role="alert"` and `aria-live="polite"` so screen readers announce them.
- Timer controls use `disabled` attribute (not just visual) so keyboard navigation skips unavailable buttons.
- `<a>` elements for quick-link buttons include `rel="noopener noreferrer"`.
- All body text uses `font-size: 1rem` (minimum 16px in modern browsers, well above the 14px minimum).
- Color is not the sole indicator for any state change (text labels accompany state changes).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Task serialization round-trip

*For any* valid Task collection of 0–500 items (each with a string `id`, 1–200-char `description`, boolean `done`, and integer `createdAt`), serializing the collection to JSON and then deserializing it SHALL produce a collection where every field of every Task (`id`, `description`, `done`, `createdAt`) is strictly equal to the original.

**Validates: Requirements 5.7**

---

### Property 2: Link serialization round-trip

*For any* valid Link collection of 0–200 items (each with a string `id`, 1–50-char `label`, valid `url`, and integer `createdAt`), serializing the collection to JSON and then deserializing it SHALL produce a collection where every field of every Link (`id`, `label`, `url`, `createdAt`) is strictly equal to the original.

**Validates: Requirements 5.8**

---

### Property 3: Task description validation rejects all invalid inputs

*For any* string that is either (a) composed entirely of whitespace characters (spaces, tabs, newlines) or (b) has a trimmed length exceeding 200 characters, `TodoList.validate()` SHALL return a non-null error message, and the task collection SHALL remain unchanged after the attempted add or save-edit operation.

**Validates: Requirements 3.3, 3.6**

---

### Property 4: Greeting mapping is exhaustive and non-overlapping across all hours

*For any* integer hour value in [0, 23], `Greeting.getGreeting(hour)` SHALL return exactly one of `"Good Morning"`, `"Good Afternoon"`, `"Good Evening"`, or `"Good Night"`. Specifically: hours 5–11 → `"Good Morning"`, hours 12–17 → `"Good Afternoon"`, hours 18–21 → `"Good Evening"`, hours 22–23 and 0–4 → `"Good Night"`. Every hour maps to exactly one greeting; no hour maps to zero or two greetings.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 5: Focus Timer format produces valid MM:SS for all representable durations

*For any* integer second value in [0, 1500], `FocusTimer.formatTime(seconds)` SHALL return a string of the form `MM:SS` where `MM` is a zero-padded two-digit integer (00–25) representing whole minutes and `SS` is a zero-padded two-digit integer (00–59) representing the remaining seconds, and `MM * 60 + SS` SHALL equal the input seconds value.

**Validates: Requirements 2.3**

---

### Property 6: Quick Links URL and label validation rejects all invalid inputs

*For any* URL string that does not begin with `"http://"` or `"https://"`, or whose length exceeds 2048 characters, `QuickLinks.validateUrl()` SHALL return a non-null error message. *For any* label string that is empty or whose length exceeds 50 characters, `QuickLinks.validateLabel()` SHALL return a non-null error message. In both cases, the link collection SHALL remain unchanged.

**Validates: Requirements 4.3, 4.4, 4.5**

---

### Property 7: Task insertion order is preserved across all non-deletion mutations

*For any* sequence of task additions followed by any combination of mark-done/mark-undone and edit operations (no deletions), the order of tasks in `TodoList.tasks` SHALL match the original insertion sequence (oldest first, newest last). No mutation other than deletion SHALL change a task's position in the array.

**Validates: Requirements 3.11**

---

### Property 8: Toggling task completion is an involution (round-trip)

*For any* task with any initial `done` state, calling `TodoList.toggleDone(id)` twice SHALL restore the task's `done` field to its original value. The operation is an involution — two toggles cancel out.

**Validates: Requirements 3.7, 3.8**

---

### Property 9: Deleting a task removes exactly that task and no other

*For any* task list containing at least one task, after calling `TodoList.delete(id)`, the task with the given `id` SHALL NOT be present in `TodoList.tasks`, the length of the list SHALL decrease by exactly 1, and every other task SHALL remain present with all fields unchanged.

**Validates: Requirements 3.9**

---

### Property 10: Adding a valid task increases collection size by exactly one

*For any* task list and any valid task description (1–200 non-whitespace-only characters), after calling `TodoList.add(description)`, the length of `TodoList.tasks` SHALL increase by exactly 1, the new task SHALL be the last element (preserving insertion order), its `description` SHALL equal the trimmed input, and its `done` field SHALL be `false`.

**Validates: Requirements 3.2, 3.11**

---

## Error Handling

### LocalStorage Failure Strategy

All `localStorage` interaction is routed through the `Storage` module. The module wraps every read and write in a `try/catch`:

```
┌─────────────┐   try/catch    ┌──────────────────────────────┐
│ Storage.read │──────────────►│ localStorage.getItem + parse  │
└─────────────┘                │  ├─ OK  → return parsed array │
                               │  └─ ERR → showError(), return null │
                               └──────────────────────────────┘

┌──────────────┐  try/catch    ┌──────────────────────────────┐
│ Storage.write │─────────────►│ JSON.stringify + setItem      │
└──────────────┘               │  ├─ OK  → (silent)           │
                               │  └─ ERR → showError()        │
                               └──────────────────────────────┘
```

**Non-blocking error banner:** `#storage-error-banner` is a fixed-position element at the top of the viewport. It is hidden by default (`hidden` attribute). When `showError(message)` is called, the banner becomes visible and displays the message. A close button inside the banner lets the user dismiss it. Subsequent errors update the message text in-place rather than stacking multiple banners.

**Caller behavior on `null` from `read()`:**
- `TodoList.load()` — initialises `this.tasks = []`, renders empty list.
- `QuickLinks.load()` — initialises `this.links = []`, renders empty container.

### Validation Error Strategy

Inline validation errors appear immediately below the relevant `<input>` via `role="alert"` spans. They are cleared when the user next successfully submits the form or begins typing. No modal or blocking dialog is used.

### Timer Edge Cases

- `start()` is a no-op when `state.running === true` or `state.finished === true` (button is disabled so the user cannot normally reach this path, but the guard is present for correctness).
- `reset()` clears `clearInterval(state.intervalId)` before setting `intervalId = null` to prevent stale intervals.

---

## Testing Strategy

### Unit Tests

Unit tests cover pure functions and specific scenarios:

- `Greeting.getGreeting(hour)` — all 24 hour values, including boundary hours (5, 12, 18, 22, 0)
- `Greeting.formatTime(date)` — zero-padding for single-digit hours and minutes
- `FocusTimer.formatTime(seconds)` — boundary values: 0, 1, 59, 60, 1499, 1500
- `TodoList.validate(description)` — empty string, whitespace-only, 200-char, 201-char, valid text
- `QuickLinks.validateLabel()`, `QuickLinks.validateUrl()` — all boundary and invalid-prefix cases
- `Storage.read()` and `Storage.write()` — with mocked `localStorage` that throws on `setItem`

### Property-Based Tests

Property-based tests verify universal correctness across the input space. The recommended library is **fast-check** (JavaScript, runs in Node.js with no browser required for pure function tests).

Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: todo-life-dashboard, Property N: <property_text>`

| Property | Test description | fast-check arbitraries |
|---|---|---|
| Property 1 | Task round-trip serialization | `fc.array(fc.record({id: fc.uuid(), description: fc.string({minLength:1, maxLength:200}), done: fc.boolean(), createdAt: fc.integer()}), {maxLength:500})` |
| Property 2 | Link round-trip serialization | `fc.array(fc.record({id: fc.uuid(), label: fc.string({minLength:1, maxLength:50}), url: fc.constant('https://x.com'), createdAt: fc.integer()}), {maxLength:200})` |
| Property 3 | Validate rejects whitespace/oversized | `fc.oneof(fc.stringOf(fc.constantFrom(' ','\t','\n')), fc.string({minLength:201}))` |
| Property 4 | Greeting exhaustive and non-overlapping | `fc.integer({min:0, max:23})` |
| Property 5 | Timer format matches MM:SS with correct arithmetic | `fc.integer({min:0, max:1500})` |
| Property 6 | URL/label validation rejects all invalid inputs | `fc.oneof(fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://')), fc.string({minLength:2049}))` for URL; `fc.oneof(fc.constant(''), fc.string({minLength:51}))` for label |
| Property 7 | Task insertion order preserved across mutations | `fc.array(fc.string({minLength:1, maxLength:200}), {minLength:1})` followed by random mark/edit ops |
| Property 8 | Toggle done is an involution | `fc.record({id: fc.uuid(), done: fc.boolean(), ...})` |
| Property 9 | Delete removes exactly the target task | `fc.array(taskArb, {minLength:1})` + pick random id to delete |
| Property 10 | Add valid task grows list by one, appended last | `fc.string({minLength:1, maxLength:200}).filter(s => s.trim().length > 0)` |

### Integration / Manual Tests

Because the app runs in the browser without a framework, the following scenarios are verified manually or with a lightweight browser automation script (Playwright):

1. LocalStorage persistence across page reload — add tasks and links, reload, verify data intact
2. LocalStorage quota exceeded — fill storage, verify error banner appears
3. Corrupted LocalStorage JSON — manually set `tdld_tasks` to `"not-json"`, reload, verify empty list and error banner
4. Responsive layout — viewport resize across 360px, 767px, 768px, 1024px breakpoints
5. Cross-browser rendering — load in Chrome, Firefox, Edge, Safari; verify no console errors

### Performance Checks

- Open the page with browser DevTools Performance panel; verify time-to-interactive < 3 s on cold load
- With 500 tasks in storage, verify task list renders and all interactions respond < 200 ms
