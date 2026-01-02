# Kanban Task Boards — UI/UX Suite

A compact portfolio suite of **4 Kanban board designs** built with **Vanilla JavaScript** (drag & drop + LocalStorage persistence).  
Same core idea, different UI systems — to showcase layout, interaction design, and product thinking.

**Author:** **gnsaved**  
**GitHub:** `https://github.com/gnsaved`

---

## Live Demos (GitHub Pages)

After enabling GitHub Pages, open:

- **Landing page (Index 1)**  
  `https://gnsaved.github.io/kanban-board-showcase/`

- **Landing page (Index 2)**  
  `https://gnsaved.github.io/kanban-board-showcase/index2.html`

Design links:

- **Design 1 — Jira-Style Board**  
  `https://gnsaved.github.io/kanban-board-showcase/design-1-jira-style/`

- **Design 2 — Alass Dark Glass**  
  `https://gnsaved.github.io/kanban-board-showcase/design-2-alass/`

- **Design 3 — iTask Glass Mesh**  
  `https://gnsaved.github.io/kanban-board-showcase/design-3-itask-glass/`

- **Design 4 — Pro Clean Board**  
  `https://gnsaved.github.io/kanban-board-showcase/design-4-pro-kanban/`

---

## What This Project Shows

- **State management** (tasks + status + order)
- **Drag & drop UX** (SortableJS)
- **Persistence** via LocalStorage
- **Multiple design systems** for the same problem
- Clean folder structure + readable code separation (`index.html`, `styles.css`, `app.js`)

---

## Project Structure

```txt
kanban-board-showcase/
├── index.html
├── landing.css
├── landing.js
├── index2.html
├── styles.css
├── README.md
├── design-1-jira-style/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── README.md
├── design-2-alass/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── README.md
├── design-3-itask-glass/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── README.md
└── design-4-pro-kanban/
    ├── index.html
    ├── styles.css
    ├── app.js
    └── README.md
```

## Run Locally

Option A: Open in browser (fastest)
- Open the project folder
- Double-click `index.html`
- Note: `index.html` is Landing 1 and `index2.html` is Landing 2

Option B: Local server (recommended)

macOS / Linux:
- Open Terminal inside the project folder
- Run: `python3 -m http.server 5500`
- Then open: `http://localhost:5500/`

Windows:
- Open Command Prompt or PowerShell inside the project folder
- Run: `python -m http.server 5500`
- Then open: `http://localhost:5500/`

Open specific pages:
- Landing 1: `http://localhost:5500/index.html`
- Landing 2: `http://localhost:5500/index2.html`
- Design 1: `http://localhost:5500/design-1-jira-style/`
- Design 2: `http://localhost:5500/design-2-alass/`
- Design 3: `http://localhost:5500/design-3-itask-glass/`
- Design 4: `http://localhost:5500/design-4-pro-kanban/`

Stop the server:
- Press `Ctrl + C` in the terminal

---

## Tech Stack
Vanilla JS, SortableJS, LocalStorage, Tailwind (in some designs)

---

## License
MIT
