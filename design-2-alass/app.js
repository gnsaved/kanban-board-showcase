/* Personal Task Board (Kanban) — Vanilla JS
   Features:
   - Drag & drop to reorder + move between columns (native HTML5 DnD)
   - LocalStorage persistence
   - Priority tags
*/

"use strict";

const STORAGE_KEY = "personal_kanban_board_v1";

const lists = {
  todo: document.getElementById("list-todo"),
  doing: document.getElementById("list-doing"),
  done: document.getElementById("list-done"),
};

const counts = {
  todo: document.getElementById("count-todo"),
  doing: document.getElementById("count-doing"),
  done: document.getElementById("count-done"),
};

const addTaskBtn = document.getElementById("addTaskBtn");
const resetBtn = document.getElementById("resetBtn");

const modal = document.getElementById("taskModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const taskForm = document.getElementById("taskForm");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const taskIdEl = document.getElementById("taskId");
const titleInput = document.getElementById("titleInput");
const descInput = document.getElementById("descInput");
const priorityInput = document.getElementById("priorityInput");

// -------------------- State --------------------
const state = loadState() ?? {
  todo: [],
  doing: [],
  done: [],
};

// -------------------- Helpers --------------------
function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "t_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}

function nowISO() {
  return new Date().toISOString();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // minimal shape validation
    if (!parsed || typeof parsed !== "object") return null;
    for (const k of ["todo", "doing", "done"]) {
      if (!Array.isArray(parsed[k])) return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function flattenToMap() {
  const map = new Map();
  for (const col of ["todo", "doing", "done"]) {
    for (const task of state[col]) map.set(task.id, task);
  }
  return map;
}

function setCounts() {
  counts.todo.textContent = String(state.todo.length);
  counts.doing.textContent = String(state.doing.length);
  counts.done.textContent = String(state.done.length);
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// -------------------- Render --------------------
function render() {
  for (const col of ["todo", "doing", "done"]) {
    const list = lists[col];
    list.innerHTML = "";

    for (const task of state[col]) {
      const li = document.createElement("li");
      li.className = "card";
      li.draggable = true;
      li.dataset.taskId = task.id;
      li.dataset.column = col;

      const desc = task.description ? `<p>${escapeHTML(task.description)}</p>` : "";

      li.innerHTML = `
        <div class="card-title">
          <h3>${escapeHTML(task.title)}</h3>
          <div class="card-actions">
            <button class="icon-btn" data-action="edit" title="Edit">✎</button>
            <button class="icon-btn" data-action="delete" title="Delete">🗑</button>
          </div>
        </div>
        ${desc}
        <div class="card-footer">
          <span class="pill ${task.priority}">${task.priority.toUpperCase()}</span>
          <span class="muted small">${new Date(task.updatedAt || task.createdAt).toLocaleDateString()}</span>
        </div>
      `;

      attachDnDHandlers(li);
      list.appendChild(li);
    }
  }

  setCounts();
}

function attachDnDHandlers(cardEl) {
  cardEl.addEventListener("dragstart", () => {
    cardEl.classList.add("dragging");
  });

  cardEl.addEventListener("dragend", () => {
    cardEl.classList.remove("dragging");
    syncStateFromDOM();
    saveState();
    render();
  });
}

// Allow drop/reorder on each list
for (const col of ["todo", "doing", "done"]) {
  const list = lists[col];

  list.addEventListener("dragover", (e) => {
    e.preventDefault();

    const dragging = document.querySelector(".card.dragging");
    if (!dragging) return;

    const afterEl = getDragAfterElement(list, e.clientY);
    if (afterEl == null) list.appendChild(dragging);
    else list.insertBefore(dragging, afterEl);
  });
}

// Figure out where to insert dragged card
function getDragAfterElement(container, y) {
  const cards = [...container.querySelectorAll(".card:not(.dragging)")];

  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

  for (const card of cards) {
    const box = card.getBoundingClientRect();
    const offset = y - (box.top + box.height / 2);

    // closest negative offset means "just above the next card"
    if (offset < 0 && offset > closest.offset) {
      closest = { offset, element: card };
    }
  }

  return closest.element;
}

// After DOM moves (drag/drop), rebuild state arrays based on list order
function syncStateFromDOM() {
  const map = flattenToMap();

  for (const col of ["todo", "doing", "done"]) {
    const list = lists[col];
    const ids = [...list.querySelectorAll(".card")].map((el) => el.dataset.taskId);
    state[col] = ids.map((id) => map.get(id)).filter(Boolean);
  }
}

// -------------------- CRUD --------------------
function openModal(mode, task = null) {
  modalTitle.textContent = mode === "edit" ? "Edit task" : "Add task";
  taskIdEl.value = task?.id ?? "";
  titleInput.value = task?.title ?? "";
  descInput.value = task?.description ?? "";
  priorityInput.value = task?.priority ?? "medium";

  modalBackdrop.hidden = false;
  modal.showModal();
  titleInput.focus();
}

function closeModal() {
  modal.close();
  modalBackdrop.hidden = true;
  taskForm.reset();
  taskIdEl.value = "";
}

function addTask({ title, description, priority }) {
  const task = {
    id: uid(),
    title: title.trim(),
    description: description.trim(),
    priority,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  state.todo.unshift(task); // newest at top
  saveState();
  render();
}

function updateTask(id, { title, description, priority }) {
  for (const col of ["todo", "doing", "done"]) {
    const idx = state[col].findIndex((t) => t.id === id);
    if (idx >= 0) {
      state[col][idx] = {
        ...state[col][idx],
        title: title.trim(),
        description: description.trim(),
        priority,
        updatedAt: nowISO(),
      };
      saveState();
      render();
      return;
    }
  }
}

function deleteTask(id) {
  for (const col of ["todo", "doing", "done"]) {
    const idx = state[col].findIndex((t) => t.id === id);
    if (idx >= 0) {
      state[col].splice(idx, 1);
      saveState();
      render();
      return;
    }
  }
}

// -------------------- UI Events --------------------
addTaskBtn.addEventListener("click", () => openModal("add"));

resetBtn.addEventListener("click", () => {
  const ok = confirm("Reset board? This will delete all tasks.");
  if (!ok) return;

  state.todo = [];
  state.doing = [];
  state.done = [];
  saveState();
  render();
});

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", closeModal);

// Form submit (Add/Edit)
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = taskIdEl.value.trim();
  const title = titleInput.value;
  const description = descInput.value;
  const priority = priorityInput.value;

  if (!title.trim()) return;

  if (id) updateTask(id, { title, description, priority });
  else addTask({ title, description, priority });

  closeModal();
});

// Event delegation for edit/delete buttons
document.getElementById("board").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const card = btn.closest(".card");
  if (!card) return;

  const action = btn.dataset.action;
  const id = card.dataset.taskId;

  if (action === "delete") {
    const ok = confirm("Delete this task?");
    if (ok) deleteTask(id);
    return;
  }

  if (action === "edit") {
    const map = flattenToMap();
    const task = map.get(id);
    if (task) openModal("edit", task);
  }
});

// -------------------- Init --------------------
render();
