
### 🎯 Core Behavior

* When the user clicks **“Add Task”**:

  * Enable **interactive mode** on both clock dials (AM & PM).
  * The clock becomes **clickable/snappable** to discrete time positions (every 5 minutes or 1 minute precision configurable).

---

### 🕒 Step 1: Select Start Time

* On the **first click on the clock dial**:

  * Snap to the nearest valid time segment.
  * Visually show a **highlighted marker** at that position.
  * Store this as `startTime` (in minutes from 00:00, internally 24h format).

* Show a floating tooltip:

  ```
  Start Time: 02:15 PM
  ```

---

### ⏱ Step 2: Enter Duration

* After selecting start time:

  * Show an input field:

    ```
    Enter duration (e.g. 1h 13m)
    ```
  * Parse flexible formats:

    * `1h13m`
    * `2h`
    * `45m`
    * `1h 5m`

* Convert duration into minutes.

---

### 🎨 Step 3: Auto-create Task

* Once duration is entered:

  * Automatically calculate:

    ```
    endTime = startTime + duration
    ```
  * Render a **task arc/segment** on the clock between start and end.

* Assign:

  * A **random soft background color** (HSL preferred for consistency).
  * Store color in task object.

---

### 📝 Step 4: Optional Task Name

* Show optional input:

  ```
  Task name (optional)
  ```
* If empty, default to `"Untitled Task"`.

---

### 🧠 Task Object Structure

```ts
{
  id: string,
  name: string,
  startTime: number, // minutes from 00:00
  duration: number,  // minutes
  endTime: number,
  color: string,     // hsl(...)
}
```

---

### 💾 Persistence

* Save all tasks in **localStorage**

  ```
  key: "sectograph_tasks"
  ```
* Load and render tasks on page load.

---

### 🎛 Editing Capabilities

* Clicking an existing task should allow:

  * Edit name
  * Edit duration
  * Change color (color picker)
  * Delete task

---

### 🧩 UI/UX Details

* Smooth transitions for arc drawing
* Hover shows:

  ```
  Task Name
  02:15 PM - 03:28 PM
  ```
* Prevent overlapping tasks OR allow overlaps with visual stacking (configurable)

---

### ⚙️ Technical Notes

* Use SVG or Canvas for clock rendering
* Maintain internal time in minutes (0–1440)
* Convert to AM/PM for display
* Snap logic:

  ```ts
  snapped = Math.round(angle / step) * step
  ```
* Separate AM and PM dials visually but unify time logic
