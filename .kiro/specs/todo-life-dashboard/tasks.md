# Implementation Plan: To-Do Life Dashboard

## Overview

Build a fully self-contained, static single-page application using HTML, CSS, and Vanilla JavaScript. The implementation proceeds in layers: scaffolding → Storage module → Greeting widget → Focus Timer → To-Do List → Quick Links → responsive layout polish → property-based and unit tests. Each step produces runnable, integrated code so the page is usable at every checkpoint.

## Tasks

- [x] 1. Scaffold the three static files
  - Create `index.html` with the full semantic HTML structure: `#storage-error-banner`, `#dashboard-grid`, and all four widget sections (`#greeting-widget`, `#focus-timer`, `#todo-list`, `#quick-links`) with every child element and ARIA attribute defined in the design
  - Create `css/style.css` as an empty stylesheet (linked from `<head>`)
  - Create `js/app.js` with the outer IIFE shell and five empty namespace object stubs (`Storage`, `Greeting`, `FocusTimer`, `TodoList`, `QuickLinks`), each with a no-op `init()`, wired to a `DOMContentLoaded` listener that calls all four `init()` functions
  - _Requirements: 6.1, 6.2, 6.3, 7.3, 7.4_

- [x] 2. Implement the Storage module
  - [x] 2.1 Implement `Storage.KEYS`, `Storage.read()`, `Storage.write()`, and `Storage.showError()`
    - `read()` wraps `JSON.parse(localStorage.getItem(key))` in try/catch; returns parsed value or `null` and calls `showError()` on failure
    - `write()` wraps `JSON.stringify` + `localStorage.setItem` in try/catch; calls `showError()` on `QuotaExceededError` without throwing
    - `showError()` makes `#storage-error-banner` visible, sets its message text, and wires a close button to re-hide it; subsequent calls update message in-place
    - Use localStorage keys `tdld_tasks` and `tdld_links`
    - _Requirements: 3.12, 3.13, 4.8 (implicit), 5.1, 5.2, 5.9, 5.10_

  - [ ]* 2.2 Write property test for Task serialization round-trip
    - Set up a `tests/` directory with `fast-check` installed via `npm init -y && npm install fast-check --save-dev`
    - Create `tests/storage.property.test.js` using Node's built-in `node:test` runner
    - **Property 1: Task serialization round-trip**
    - **Validates: Requirements 5.7**
    - Tag: `// Feature: todo-life-dashboard, Property 1: Task serialization round-trip`
    - Use `fc.array(fc.record({id: fc.uuid(), description: fc.string({minLength:1, maxLength:200}), done: fc.boolean(), createdAt: fc.integer()}), {maxLength:500})`

  - [ ]* 2.3 Write property test for Link serialization round-trip
    - Add to `tests/storage.property.test.js`
    - **Property 2: Link serialization round-trip**
    - **Validates: Requirements 5.8**
    - Tag: `// Feature: todo-life-dashboard, Property 2: Link serialization round-trip`
    - Use `fc.array(fc.record({id: fc.uuid(), label: fc.string({minLength:1, maxLength:50}), url: fc.constant('https://x.com'), createdAt: fc.integer()}), {maxLength:200})`

- [x] 3. Implement the Greeting widget
  - [x] 3.1 Implement `Greeting.init()`, `Greeting.render()`, `Greeting.getGreeting(hour)`, `Greeting.formatTime(date)`, `Greeting.formatDate(date)`, and `Greeting.tick()`
    - `getGreeting`: hours 5–11 → "Good Morning"; 12–17 → "Good Afternoon"; 18–21 → "Good Evening"; 22–23 and 0–4 → "Good Night"
    - `formatTime`: returns zero-padded "HH:MM" from a `Date` object
    - `formatDate`: returns locale date string with full weekday, full month, day, and year
    - `init()` calls `render()` synchronously then starts `setInterval(Greeting.tick, 60_000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 3.2 Write property test for Greeting exhaustive and non-overlapping mapping
    - Create `tests/greeting.property.test.js`
    - **Property 4: Greeting mapping is exhaustive and non-overlapping across all hours**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - Tag: `// Feature: todo-life-dashboard, Property 4: Greeting exhaustive and non-overlapping`
    - Use `fc.integer({min:0, max:23})`; assert each hour maps to exactly one of the four valid strings

  - [ ]* 3.3 Write unit tests for Greeting pure functions
    - Create `tests/greeting.unit.test.js`
    - Cover all 24 hour values for `getGreeting` including boundary hours (5, 12, 18, 22, 0)
    - Cover zero-padding for single-digit hours and minutes in `formatTime`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

- [x] 4. Implement the Focus Timer
  - [x] 4.1 Implement `FocusTimer.init()`, `FocusTimer.start()`, `FocusTimer.stop()`, `FocusTimer.reset()`, `FocusTimer.tick()`, `FocusTimer.render()`, and `FocusTimer.formatTime(seconds)`
    - Initialise `state = {remaining: 1500, running: false, intervalId: null, finished: false}`
    - `start()` is a no-op if `running` or `finished`; otherwise sets `running = true`, starts `setInterval(FocusTimer.tick, 1000)`
    - `tick()` decrements `remaining`; when it hits 0 clears the interval, sets `finished = true`, shows `#timer-finished-banner`
    - `stop()` clears interval, sets `running = false`
    - `reset()` calls `clearInterval`, resets all state fields to initial values, hides banner
    - `render()` updates `#timer-display` and sets `disabled` on buttons per state machine rules
    - `formatTime(seconds)` returns "MM:SS" with zero-padded two-digit fields
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [ ]* 4.2 Write property test for Focus Timer format
    - Create `tests/focustimer.property.test.js`
    - **Property 5: Focus Timer format produces valid MM:SS for all representable durations**
    - **Validates: Requirements 2.3**
    - Tag: `// Feature: todo-life-dashboard, Property 5: Timer format valid MM:SS`
    - Use `fc.integer({min:0, max:1500})`; assert `MM*60 + SS === input` and both fields are zero-padded two digits

  - [ ]* 4.3 Write unit tests for Focus Timer pure functions
    - Create `tests/focustimer.unit.test.js`
    - Cover `formatTime` at boundary values: 0, 1, 59, 60, 1499, 1500
    - _Requirements: 2.3_

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the To-Do List module
  - [x] 6.1 Implement `TodoList.generateId()`, `TodoList.validate()`, `TodoList.load()`, `TodoList.save()`, `TodoList.render()`, and `TodoList.renderTask(task)`
    - `generateId()` returns `crypto.randomUUID()` with a `Date.now().toString()` fallback
    - `validate(description)` returns a non-null error string for empty, whitespace-only, or >200-char input; `null` otherwise
    - `load()` calls `Storage.read(Storage.KEYS.TASKS)`; on `null` initialises `this.tasks = []`
    - `render()` clears `#todo-list-items` innerHTML and rebuilds from `this.tasks`; each `<li>` has a checkbox (toggle done), task text (with `text-decoration: line-through` when done), an edit button, and a delete button
    - `renderTask(task)` creates and returns one `<li>` with all controls wired
    - `save()` calls `Storage.write(Storage.KEYS.TASKS, this.tasks)`
    - _Requirements: 3.1, 3.10, 3.11, 3.12, 3.13, 5.1, 5.3, 5.5, 5.7_

  - [x] 6.2 Implement `TodoList.add()`, `TodoList.toggleDone()`, and `TodoList.delete()`
    - `add(description)`: validates, trims, creates a `Task` object with new `id`, `done: false`, `createdAt: Date.now()`, pushes to end of `this.tasks`, calls `save()` and `render()`; shows inline error via `#todo-input-error` on validation failure
    - `toggleDone(id)`: flips the `done` boolean for the matching task; calls `save()` and `render()`
    - `delete(id)`: splices the matching task from `this.tasks`; calls `save()` and `render()`
    - Wire `#todo-form` submit event to `add()`
    - _Requirements: 3.2, 3.3, 3.7, 3.8, 3.9, 3.10, 3.11_

  - [x] 6.3 Implement `TodoList.beginEdit()`, `TodoList.saveEdit()`, and `TodoList.cancelEdit()`
    - `beginEdit(id)`: replaces the task's `<li>` with an edit `<form>` containing a pre-populated `<input>` and Save/Cancel buttons; if another task is already in edit mode, auto-cancel it first; place cursor at end of input
    - `saveEdit(id, description)`: validates, trims, updates `task.description`, calls `save()` and `render()`; shows inline validation message on failure
    - `cancelEdit(id)`: re-renders without saving
    - _Requirements: 3.4, 3.5, 3.6, 3.9 (partial), 3.10_

  - [ ]* 6.4 Write property test for Task description validation
    - Create `tests/todolist.property.test.js`
    - **Property 3: Task description validation rejects all invalid inputs**
    - **Validates: Requirements 3.3, 3.6**
    - Tag: `// Feature: todo-life-dashboard, Property 3: validate rejects whitespace/oversized`
    - Use `fc.oneof(fc.stringOf(fc.constantFrom(' ','\t','\n')), fc.string({minLength:201}))`

  - [ ]* 6.5 Write property test for task insertion order preservation
    - Add to `tests/todolist.property.test.js`
    - **Property 7: Task insertion order is preserved across all non-deletion mutations**
    - **Validates: Requirements 3.11**
    - Tag: `// Feature: todo-life-dashboard, Property 7: insertion order preserved`
    - Use `fc.array(fc.string({minLength:1, maxLength:200}).filter(s => s.trim().length > 0), {minLength:1})` for descriptions; simulate random mark/edit ops and assert order unchanged

  - [ ]* 6.6 Write property test for toggle done involution
    - Add to `tests/todolist.property.test.js`
    - **Property 8: Toggling task completion is an involution**
    - **Validates: Requirements 3.7, 3.8**
    - Tag: `// Feature: todo-life-dashboard, Property 8: toggle done is an involution`
    - Use a task with `fc.boolean()` for `done`; call `toggleDone` twice and assert `done` equals original

  - [ ]* 6.7 Write property test for delete removes exactly one task
    - Add to `tests/todolist.property.test.js`
    - **Property 9: Deleting a task removes exactly that task and no other**
    - **Validates: Requirements 3.9**
    - Tag: `// Feature: todo-life-dashboard, Property 9: delete removes exactly target`
    - Use `fc.array(taskArb, {minLength:1})`; pick a random `id`; assert length decreases by 1 and all other tasks are unchanged

  - [ ]* 6.8 Write property test for add valid task grows list by one
    - Add to `tests/todolist.property.test.js`
    - **Property 10: Adding a valid task increases collection size by exactly one**
    - **Validates: Requirements 3.2, 3.11**
    - Tag: `// Feature: todo-life-dashboard, Property 10: add grows list by one appended last`
    - Use `fc.string({minLength:1, maxLength:200}).filter(s => s.trim().length > 0)`; assert length +1, last element has trimmed description and `done === false`

  - [ ]* 6.9 Write unit tests for TodoList pure functions
    - Create `tests/todolist.unit.test.js`
    - Cover `validate`: empty string, whitespace-only, 200-char (valid), 201-char (invalid), normal text
    - _Requirements: 3.3, 3.6_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement the Quick Links module
  - [x] 8.1 Implement `QuickLinks.validateLabel()`, `QuickLinks.validateUrl()`, `QuickLinks.load()`, `QuickLinks.save()`, `QuickLinks.render()`, and `QuickLinks.renderLink(link)`
    - `validateLabel(label)`: error if empty or >50 chars; `null` otherwise
    - `validateUrl(url)`: error if empty, >2048 chars, or does not start with `"http://"` or `"https://"`; `null` otherwise
    - `load()` calls `Storage.read(Storage.KEYS.LINKS)`; on `null` initialises `this.links = []`
    - `renderLink(link)` creates an `<a>` styled as a button (`target="_blank"`, `rel="noopener noreferrer"`) and a paired delete `<button>` wrapped in a container element
    - `render()` clears `#link-buttons` innerHTML and rebuilds from `this.links`
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 5.2, 5.4, 5.6, 5.8_

  - [x] 8.2 Implement `QuickLinks.add()` and `QuickLinks.delete()`
    - `add(label, url)`: validates both fields, trims, creates `Link` object, pushes, calls `save()` and `render()`; shows inline errors via `#link-label-error` and `#link-url-error`
    - `delete(id)`: splices the matching link, calls `save()` and `render()`
    - Wire `#link-form` submit event to `add()`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_

  - [ ]* 8.3 Write property test for Quick Links URL and label validation
    - Create `tests/quicklinks.property.test.js`
    - **Property 6: Quick Links URL and label validation rejects all invalid inputs**
    - **Validates: Requirements 4.3, 4.4, 4.5**
    - Tag: `// Feature: todo-life-dashboard, Property 6: URL/label validation rejects invalid`
    - For URL: `fc.oneof(fc.string().filter(s => !s.startsWith('http://') && !s.startsWith('https://')), fc.string({minLength:2049}))`
    - For label: `fc.oneof(fc.constant(''), fc.string({minLength:51}))`

  - [ ]* 8.4 Write unit tests for QuickLinks validation
    - Create `tests/quicklinks.unit.test.js`
    - Cover `validateLabel`: empty, 50-char (valid), 51-char (invalid)
    - Cover `validateUrl`: missing protocol, `ftp://` prefix, valid `http://`, valid `https://`, >2048 chars
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 9. Implement responsive CSS layout and visual styling
  - [x] 9.1 Write the full `css/style.css`
    - Mobile-first base: `#dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 16px; padding: 16px; min-width: 0; }` and `body { overflow-x: hidden; }`
    - Breakpoint at 768px: `grid-template-columns: repeat(2, 1fr)`
    - Widget styles: distinct background color with ≥3:1 contrast against page background; `border-radius`, `padding`, `box-shadow` for visual separation
    - Font sizes: all body text `font-size: 1rem` (≥16px)
    - Timer display: large `font-size` (e.g., 3rem) using monospace font
    - Strikethrough style for completed tasks: `text-decoration: line-through; opacity: 0.6`
    - `#storage-error-banner`: fixed position at top of viewport, high `z-index`, hidden by default
    - `#timer-finished-banner`: styled as a distinct success/notice element
    - Button and input focus styles with visible focus ring for keyboard navigation
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7, 6.8, 7.2_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Run all property-based and unit tests via `node --test tests/` to confirm green; fix any failures
  - Open `index.html` in a browser, verify all four widgets render, the grid switches layout at 768px, storage persists on reload, and no console errors appear
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- The `tests/` directory requires Node.js; run tests with `node --test tests/` (Node 18+) after installing `fast-check` via `npm install fast-check --save-dev`
- Each task references specific requirements for traceability
- Properties 1–10 from the design document each have a corresponding optional test sub-task
- The main application (`index.html`, `css/style.css`, `js/app.js`) has zero runtime dependencies and requires no build step

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.4"] },
    { "id": 6, "tasks": ["6.3", "6.5", "6.6", "6.7", "6.8"] },
    { "id": 7, "tasks": ["6.9", "8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3"] },
    { "id": 9, "tasks": ["8.4", "9.1"] }
  ]
}
```
