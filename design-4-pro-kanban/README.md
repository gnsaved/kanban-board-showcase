# Pro Kanban Board (Design 4)

A clean, professional Kanban board built with **Vanilla JavaScript**,
**Tailwind (CDN)**, and **SortableJS** --- fully offline and saved in
**LocalStorage**.

------------------------------------------------------------------------

## Features

-   Drag & drop tasks across columns (To Do / In Progress / Completed)
-   Reorder tasks within a column
-   Persists **status + order** in LocalStorage
-   Priority tags (Low / Medium / High)
-   Modal task creation and delete
-   Offline-first --- no backend required

------------------------------------------------------------------------

## Project Structure

    design-4-pro-kanban/
      index.html
      styles.css
      app.js
      README.md

------------------------------------------------------------------------

## Run Locally

Simply open `index.html` in your browser.

### Optional local server

``` bash
python -m http.server 5500
```

Then open:

    http://localhost:5500

------------------------------------------------------------------------

## How It Works

-   Tasks are stored as JSON in `localStorage` under the key:

        kanban_design4_data

-   Dragging a card updates its **column + position** and automatically
    saves changes.

-   Reloading the page restores the full board state.

------------------------------------------------------------------------

## Tech Stack

-   Vanilla JavaScript (no framework)
-   Tailwind CSS (CDN)
-   SortableJS for drag & drop
-   Browser LocalStorage

------------------------------------------------------------------------

## Customization

-   Edit colors or layout in `index.html` (Tailwind utility classes).
-   Update drag placeholder style in `styles.css` using `.ghost-card`.
-   Extend task data in `app.js` (e.g., due dates, tags, owners).

------------------------------------------------------------------------

## License

MIT --- free to use, modify, and share.
