
# iTask Kanban Board (Design 3)

A modern Kanban board with a **mesh gradient background** and **glassmorphism columns**. Built with **Vanilla JavaScript**, **Tailwind (CDN)**, and **SortableJS** — fully offline with **LocalStorage** persistence.

---

## Features
- Drag & drop tasks across columns (**To Do / In Progress / Done**)
- Reorder tasks within a column
- Persists **status + order** after dragging (not just status)
- Priority tags (**Low / Medium / High**)
- Modal task creation + delete
- LocalStorage persistence (offline-first)
- Mobile-friendly layout and touch interactions

---

## Project Structure
design-3-itask-kanban/
  index.html
  styles.css
  app.js
  README.md

---

## Run Locally

Simply open `index.html` in your browser.

Optional (recommended) local server:

python -m http.server 5500

Then open:

http://localhost:5500

---

## How It Works
- Tasks are stored as JSON in your browser LocalStorage under the key:
  itask_design3_data
- Drag & drop updates both the task column and its position (order).
- Reloading the page restores your full board state (tasks, priorities, columns, order).

---

## Tech Stack
- Vanilla JavaScript (no framework)
- Tailwind CSS (CDN)
- SortableJS for drag & drop
- Browser LocalStorage (offline persistence)

---

## Customization
- Adjust layout, spacing, and typography in index.html using Tailwind classes.
- Update the mesh gradient / glass styles in styles.css.
- Extend task fields in app.js (e.g., due dates, tags, assignees).

---

## License
MIT — free to use, modify, and share.
