# Requirements Document

## Introduction

The To Do List Life Dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It provides users with a personal productivity hub that combines time awareness (greeting and date/time display), a focus timer based on the Pomodoro technique, a persistent task list, and a quick-access links panel. All data is stored client-side using the Browser Local Storage API. The app is designed to load instantly in any modern browser and function as a standalone web page or browser extension, with no backend, build tools, or external dependencies.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The UI component that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Task_List**: The UI component that manages the collection of user-created tasks.
- **Task**: A single to-do item consisting of a text description and a completion status.
- **Quick_Links**: The UI component that manages and displays user-defined shortcut buttons to external URLs.
- **Link**: A user-defined entry consisting of a label and a URL used in the Quick_Links component.
- **Local_Storage**: The Browser Local Storage API, used as the sole persistence mechanism.
- **Timer_Session**: The state of the Focus_Timer between a start and a stop or completion event.
- **Theme_Toggle**: The UI control that switches the Dashboard between light and dark visual themes.
- **Timer_Duration**: The user-configured duration (in minutes) for a Focus Timer session, defaulting to 25 minutes.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I immediately have time awareness and feel welcomed.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updating every 60 seconds.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Thursday, July 17, 2026").
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local hour is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local hour is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. THE Greeting_Widget SHALL derive all time and date values from the browser's local system clock without any server calls.
8. THE Greeting_Widget SHALL complete its initial render and display the correct time, date, and greeting within 1 second of the page becoming interactive.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can use focused work intervals to improve my productivity.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes (1500 seconds) on page load.
2. WHEN the user activates the start control, THE Focus_Timer SHALL begin counting down in one-second intervals, updating the displayed time each second.
3. WHILE a Timer_Session is active, THE Focus_Timer SHALL display the remaining time in MM:SS format (zero-padded minutes 00–24, zero-padded seconds 00–59).
4. WHEN the user activates the stop control during an active Timer_Session, THE Focus_Timer SHALL pause the countdown and retain the remaining time value.
5. WHEN the user activates the start control after a stop, THE Focus_Timer SHALL resume the countdown from the retained remaining time value.
6. WHEN the user activates the reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00.
7. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual indication that the session has ended; this indication SHALL persist until the reset control is activated.
8. WHILE a Timer_Session is active, THE Focus_Timer SHALL disable the start control to prevent duplicate intervals.
9. WHILE a Timer_Session is inactive, THE Focus_Timer SHALL disable the stop control.
10. WHEN the user activates the reset control during an active Timer_Session, THE Focus_Timer SHALL immediately stop the countdown, clear any session-ended visual indication, and restore the displayed time to 25:00.
11. WHEN the countdown has reached 00:00 and the user activates the start control, THE Focus_Timer SHALL treat the action as a no-op; the timer SHALL NOT restart automatically.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, mark as done, and delete tasks that persist between browser sessions, so that I can manage my daily responsibilities reliably.

#### Acceptance Criteria

1. THE Task_List SHALL load all previously saved Tasks from Local_Storage and render them within 500ms of page load.
2. WHEN the user submits a non-empty task description of 1 to 200 characters, THE Task_List SHALL add a new Task with the provided description and a default completion status of incomplete.
3. IF the user attempts to submit an empty, whitespace-only, or greater-than-200-character task description, THEN THE Task_List SHALL reject the submission and display an inline validation message.
4. WHEN the user activates the edit control on a Task, THE Task_List SHALL present the task description in an editable input field pre-populated with the current description, with the cursor placed at the end of the text.
5. WHEN the user saves an edited Task with a non-empty description of 1 to 200 characters, THE Task_List SHALL update the Task's description to the trimmed new value.
6. IF the user attempts to save an edited Task with an empty, whitespace-only, or greater-than-200-character description, THEN THE Task_List SHALL reject the save, display an inline validation message, and retain the previous description unchanged.
7. WHEN the user activates the mark-as-done control on an incomplete Task, THE Task_List SHALL update the Task's completion status to complete and apply a strikethrough visual style to the Task text.
8. WHEN the user activates the mark-as-done control on a complete Task, THE Task_List SHALL update the Task's completion status to incomplete and remove the strikethrough visual style.
9. WHEN the user activates the delete control on a Task, THE Task_List SHALL remove the Task from the list permanently, without affecting other Tasks or any active edit state on other Tasks.
10. WHEN any Task is added, edited, marked, or deleted, THE Task_List SHALL persist the full updated Task collection to Local_Storage synchronously before the next user interaction can be processed.
11. THE Task_List SHALL preserve Task order as determined by insertion sequence (most recently added Task last) across all mutation operations and page loads.
12. IF a Local_Storage read operation fails on page load, THEN THE Task_List SHALL initialize with an empty collection and display a non-blocking error notice to the user.
13. IF a Local_Storage write operation fails after a Task mutation, THEN THE Task_List SHALL display a non-blocking error notice to the user indicating the data could not be saved.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and access buttons that open my favorite websites, so that I can navigate to frequently visited pages from a single location.

#### Acceptance Criteria

1. THE Quick_Links SHALL load all previously saved Links from Local_Storage on page load and render one button per saved Link, each displaying its label.
2. WHEN the user submits a new Link with a label of 1–50 characters and a URL of 1–2048 characters that begins with "http://" or "https://", THE Quick_Links SHALL add a new button for that Link.
3. IF the user attempts to submit a new Link with an empty label or a label exceeding 50 characters, THEN THE Quick_Links SHALL reject the submission, identify the label field in an inline validation message, and preserve the current form field values.
4. IF the user attempts to submit a Link with an empty URL or a URL exceeding 2048 characters, THEN THE Quick_Links SHALL reject the submission, identify the URL field in an inline validation message, and preserve the current form field values.
5. IF the user attempts to submit a URL that does not begin with "http://" or "https://", THEN THE Quick_Links SHALL reject the submission and display an inline validation message stating that the URL must begin with "http://" or "https://".
6. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab without navigating away from the current page.
7. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL remove the Link from the panel immediately without requiring a page reload.
8. WHEN any Link is added or deleted, THE Quick_Links SHALL persist the full updated Link collection to Local_Storage before the operation is considered complete.

---

### Requirement 5: Data Persistence and Integrity

**User Story:** As a user, I want my tasks and links to be reliably saved and restored across browser sessions, so that I never lose my data on page reload or browser restart.

#### Acceptance Criteria

1. THE Dashboard SHALL serialize the Task collection as a JSON array and store it under a fixed, application-specific key in Local_Storage whenever the Task collection changes.
2. THE Dashboard SHALL serialize the Link collection as a JSON array and store it under a fixed, application-specific key in Local_Storage whenever the Link collection changes.
3. WHEN the Dashboard loads and Local_Storage contains a previously saved Task collection, THE Dashboard SHALL deserialize and render all saved Tasks within 500ms of page load.
4. WHEN the Dashboard loads and Local_Storage contains a previously saved Link collection, THE Dashboard SHALL deserialize and render all saved Links within 500ms of page load.
5. IF Local_Storage is empty or does not contain a Task collection key on load, THEN THE Dashboard SHALL initialize the Task_List with an empty collection and render zero task items.
6. IF Local_Storage is empty or does not contain a Link collection key on load, THEN THE Dashboard SHALL initialize Quick_Links with an empty collection and render zero link buttons.
7. FOR ALL valid Task collections of size 0 to 500, serializing then deserializing SHALL produce a Task collection where each field of each Task is identical to the original.
8. FOR ALL valid Link collections of size 0 to 200, serializing then deserializing SHALL produce a Link collection where each field of each Link is identical to the original.
9. IF a Local_Storage write operation fails, THEN THE Dashboard SHALL display a non-blocking error notice to the user and SHALL NOT silently discard the failure.
10. IF the data retrieved from Local_Storage cannot be parsed as valid JSON on load, THEN THE Dashboard SHALL discard the corrupted data, initialize the affected collection as empty, and display a non-blocking error notice to the user.

---

### Requirement 6: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and visually organized interface, so that I can find and use each feature without confusion or visual fatigue.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four widgets (Greeting_Widget, Focus_Timer, Task_List, Quick_Links) on a single HTML page without page navigation.
2. THE Dashboard SHALL use a single CSS file located at `css/style.css` for all visual styling.
3. THE Dashboard SHALL use a single JavaScript file located at `js/app.js` for all application logic.
4. THE Dashboard SHALL apply a clear visual separation between each widget using at least one of: a minimum 16px spacing gap, a 1px or thicker border, or a background color contrast ratio of at least 3:1 between adjacent widgets.
5. THE Dashboard SHALL use a font size of at least 14px for all body text to maintain readability.
6. THE Dashboard SHALL render without horizontal scrolling on viewport widths of 360px and above.
7. WHEN the viewport width is 768px or above, THE Dashboard SHALL arrange the four widgets in a multi-column grid layout with at least 2 columns.
8. WHEN the viewport width is below 768px, THE Dashboard SHALL arrange the four widgets in a single-column stacked layout.
9. WHEN the viewport width is 768px or above and the viewport height is 600px or above, all four widgets SHALL be fully visible without vertical scrolling immediately after page load.

---

### Requirement 7: Performance and Compatibility

**User Story:** As a user, I want the Dashboard to load and respond instantly in any modern browser, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL load and become interactive (all UI elements visible and responding to input, measured from file open) within 3 seconds when opened from the local filesystem on a machine with a standard broadband connection (10 Mbps or above), without making any external network requests at runtime.
2. THE Dashboard SHALL function correctly in the latest stable release of Chrome, Firefox, Edge, and Safari, where "function correctly" means all widgets render the same visible output, no UI elements are missing, no JavaScript errors appear in the browser console, and no layout breakage occurs.
3. THE Dashboard SHALL operate without any server-side backend, build tools, or package managers; all source files SHALL be static assets deliverable directly from the local filesystem without server-side processing.
4. THE Dashboard SHALL not depend on any third-party JavaScript libraries or CSS frameworks; all code SHALL be written in Vanilla JavaScript and plain CSS.
5. WHEN the user interacts with any UI control (button click, form submission, checkbox toggle), THE Dashboard SHALL reflect the updated UI state within 200ms of the interaction event.

---

### Requirement 8: Theme Toggle (Light/Dark Mode)

**User Story:** As a user, I want to toggle between a light and a dark visual theme, so that I can use the Dashboard comfortably in different lighting conditions without straining my eyes.

#### Acceptance Criteria

1. THE Dashboard SHALL render a Theme_Toggle control that is permanently visible, has a minimum touch/click target size of 44×44 CSS pixels, and is reachable via keyboard at any viewport width supported by the layout.
2. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL switch the active theme from light to dark or from dark to light, updating all background colors, text colors, and widget surface colors across the entire page within 100 milliseconds, without a page reload.
3. WHEN the Dashboard loads and Local_Storage contains a previously saved theme preference under the key `tdld_theme`, THE Dashboard SHALL apply the saved theme before the first visible render so that no flash of the opposite theme occurs.
4. IF Local_Storage does not contain a `tdld_theme` key on load, THEN THE Dashboard SHALL apply the light theme as the default.
5. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL persist the newly selected theme value (`"light"` or `"dark"`) to Local_Storage under the key `tdld_theme` before the visual change is applied.
6. THE Dashboard SHALL implement the light and dark themes using a CSS class toggled on the `<body>` element, so that all widget colors are controlled by a single class change without inline styles.
7. WHILE the dark theme is active, THE Dashboard SHALL maintain a minimum text-to-background contrast ratio of 4.5:1 for all body text and interactive control labels, as specified by WCAG 2.1 Level AA.
8. WHILE the light theme is active, THE Dashboard SHALL maintain a minimum text-to-background contrast ratio of 4.5:1 for all body text and interactive control labels, as specified by WCAG 2.1 Level AA.
9. IF a Local_Storage write operation for the theme preference fails, THEN THE Dashboard SHALL still apply the visual theme change in the current session and display a non-blocking error notice in the top area of the viewport that auto-dismisses after no more than 5 seconds.
10. THE Theme_Toggle SHALL reflect the current active theme state through an accessible label or icon change (e.g., aria-label updates from "Switch to dark mode" to "Switch to light mode") so that the active theme is always identifiable without toggling.

---

### Requirement 9: Configurable Pomodoro Timer Duration

**User Story:** As a user, I want to set a custom focus timer duration, so that I can adapt the Pomodoro interval to my personal work style instead of being locked into 25 minutes.

#### Acceptance Criteria

1. THE Focus_Timer SHALL display a duration configuration control (visible and interactable only when no Timer_Session is active) that allows the user to enter a desired Timer_Duration in whole minutes.
2. WHEN the user submits a Timer_Duration value that is a whole number integer between 1 and 180 inclusive, THE Focus_Timer SHALL update the countdown to the new duration in seconds and update the display to the new MM:SS value within 300 milliseconds.
3. IF the user submits a Timer_Duration value that is not a whole number, is less than 1, or is greater than 180, THEN THE Focus_Timer SHALL reject the input, display an inline validation message adjacent to the configuration control specifying the allowed range (1–180 minutes), and leave the current duration unchanged.
4. WHEN the user activates the reset control after a custom Timer_Duration has been set, THE Focus_Timer SHALL restore the countdown to the user-configured duration in seconds (not to the default 1500 seconds), and the display SHALL show the corresponding MM:SS value.
5. WHEN the user successfully saves a new Timer_Duration, THE Focus_Timer SHALL persist the integer minute value to Local_Storage under the key `tdld_timer_duration` before updating the display.
6. WHEN the Dashboard loads and Local_Storage contains a previously saved integer value between 1 and 180 under `tdld_timer_duration`, THE Focus_Timer SHALL initialize with that saved duration instead of the default 1500 seconds.
7. IF Local_Storage does not contain a `tdld_timer_duration` key on load, or if the stored value is not a valid integer between 1 and 180, THEN THE Focus_Timer SHALL initialize with the default duration of 1500 seconds and display "25:00".
8. WHILE a Timer_Session is active, THE Focus_Timer SHALL disable the duration configuration control so that the duration cannot be changed mid-session.
9. WHEN the user activates the reset control, THE Focus_Timer SHALL re-enable the duration configuration control within 300 milliseconds if it was previously disabled.
10. IF a Local_Storage write operation for the timer duration fails, THEN THE Focus_Timer SHALL still apply the new duration in the current session and display a non-blocking error notice that auto-hides after no more than 5 seconds.

---

### Requirement 10: Prevent Duplicate Tasks

**User Story:** As a user, I want the system to prevent me from adding a task that already exists in my list, so that I do not clutter my task list with accidental duplicates.

#### Acceptance Criteria

1. WHEN the user attempts to add a new Task whose trimmed, case-insensitive description exactly matches the trimmed, case-insensitive description of any existing Task in the Task_List, THE Task_List SHALL reject the submission without adding a new Task.
2. WHEN a duplicate Task submission is rejected, THE Task_List SHALL display an inline error message adjacent to the task input field indicating that the task already exists; the message SHALL appear within 200ms of the submission event.
3. WHEN a duplicate Task submission is rejected, THE Task_List SHALL leave the input field value unchanged so that the user can see and correct the duplicate entry.
4. WHEN the user modifies the input field after a duplicate rejection, THE Task_List SHALL clear the duplicate error message as soon as the field value changes.
5. THE Task_List SHALL perform the duplicate check after trimming leading and trailing whitespace from the input and after converting both the input and all existing task descriptions to lowercase, so that "Buy Milk", "  buy milk  ", and "BUY MILK" are all treated as duplicates of an existing task "buy milk".
6. WHEN the user edits an existing Task and saves a description that matches a different existing Task (case-insensitive, trimmed), THE Task_List SHALL reject the save, display an inline validation message adjacent to the edit field within 200ms of the save event indicating the duplicate, and retain the Task's previous description unchanged.
7. IF no existing Task matches the submitted description (case-insensitive, trimmed), THEN THE Task_List SHALL proceed with the normal task-addition flow as defined in Requirement 3.
8. IF the Task_List is empty, THEN THE Task_List SHALL skip the duplicate check entirely and proceed directly to the normal validation flow.
9. WHEN the user blurs or navigates away from the input field without modifying it after a duplicate rejection, THE Task_List SHALL retain the duplicate error message until the user either modifies the field value or successfully submits a non-duplicate task.
