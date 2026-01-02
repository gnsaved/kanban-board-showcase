# Jira-Style Personal Task Board (Kanban)

A lightweight Kanban board inspired by Jira’s layout. Manage tasks across **To Do**, **In Progress**, and **Done** with drag-and-drop, priority indicators, and automatic saving via LocalStorage.

## Features
- Jira-style UI layout (left rail, sidebar, header controls, board columns)
- Drag & drop to move and reorder tasks
- Auto-save using LocalStorage (no backend required)
- Priority indicator: Low / Medium / High
- Issue keys like KB-001, KB-002, ...
- Create / Edit / Delete tasks + Reset board
- Search + Priority filter
- WIP badge on In Progress (highlights when exceeded)

## Project Structure
personal-task-board-kanban/
- index.html
- styles.css
- app.js
- README.md

## Run Locally

### Quick start
Open `index.html` in your browser (double-click it).

### VS Code Live Server (recommended)
1. Open the folder in VS Code
2. Install the "Live Server" extension
3. Right-click `index.html` -> "Open with Live Server"

### Python HTTP server
Run this from inside the project folder:
```bash
python -m http.server 5500
