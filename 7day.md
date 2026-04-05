

Create a **7-day week calendar view (Google Calendar style)** for a sectograph-based time management app, placed **below the dual 12-hour clock disks (AM & PM)**.

### Week Structure

* Always display a **fixed week layout: Monday → Sunday**
* Do NOT start from today
* Show current week based on selected date
* Include:

  * **Week navigation controls** (← Previous Week / Next Week →)
  * Optional **“Today” button** to jump back to current week

### Header

* Each column represents a day:

  * Top shows:

    * Day name (Mon, Tue, … Sun)
    * Date (e.g., 6 Apr)
* Highlight:

  * **Current day** (subtle background or border)
  * **Selected day** (if clicked)

### Layout

* 7 equal-width vertical columns
* Full height represents time of day
* Use a **vertical time grid**:

  * 12-hour split visually (AM / PM sections)
  * Or subtle 24-hour grid with hourly lines

### Task Rendering

Tasks come from clock input with:

* start time
* duration
* color
* optional name
* date

Inside each day column:

* Render tasks as **absolute-positioned blocks**
* Vertical position = start time
* Height = duration
* Background = task color
* Rounded corners + slight shadow

### Interaction

* Click task → open edit modal (name, duration, color, date)
* Hover → tooltip:

  * task name
  * start → end time
* Drag (optional advanced):

  * Move vertically → change time
  * Move across columns → change date

### Sync with Clock

* When task is created via clock:

  * Assign it to a selected date (default: today)
  * Instantly render in correct day column

### Empty State

* If a day has no tasks:

  * Show subtle placeholder: “No tasks”

### Styling

* Clean, minimal (inspired by Google Calendar)
* Smooth animations for:

  * task creation
  * dragging
  * week switching

### Responsiveness

* Desktop: full 7 columns visible
* Mobile:

  * Horizontal scroll OR
  * Collapse into swipeable days

### Persistence

* Store in localStorage with date key:
