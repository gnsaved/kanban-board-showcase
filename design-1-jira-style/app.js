"use strict";

/**
 * Jira-style Kanban (Vanilla JS)
 * - Drag & drop reorder + move
 * - LocalStorage persistence
 * - Priority tags (low/medium/high)
 * - Issue keys like KB-001
 * - Search + Label filter (dragging disabled while filtering for correctness)
 */

const STORAGE_KEY = "jira_style_kanban_v1";
const WIP_LIMIT_DOING = 3;
const KEY_PREFIX = "KB";

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
const floatingAdd = document.getElementById("floatingAdd");

const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");
const filterHint = document.getElementById("filterHint");
const wipBadge = document.getElementById("wipBadge");

const modal = document.getElementById("taskModal");
const backdrop = document.getElementById("backdrop");
const taskForm = document.getElementById("taskForm");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const taskIdEl = document.getElementById("taskId");
const taskColumnEl = document.getElementById("taskColumn");
const titleInput = document.getElementById("titleInput");
const descInput = document.getElementById("descInput");
const priorityInput = document.getElementById("priorityInput");
const assigneeInput = document.getElementById("assigneeInput");

// UI state
const ui = {
  query: "",
  label: "all", // priority filter
};

// Drag state
let draggingId = null;

// -------------------- storage --------------------
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    for (const k of ["todo", "doing", "done"]) {
      if (!Array.isArray(parsed[k])) return null;
    }
    if (!parsed.meta || typeof parsed.meta !== "object") parsed.meta = { seq: 0 };
    if (typeof parsed.meta.seq !== "number") parsed.meta.seq = 0;
    return parsed;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nowISO() {
  return new Date().toISOString();
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "t_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}

function nextKey() {
  state.meta.seq += 1;
  const n = String(state.meta.seq).padStart(3, "0");
  return `${KEY_PREFIX}-${n}`;
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// -------------------- state --------------------
const state =
  loadState() ??
  {
    meta: { seq: 3 },
    todo: [
      mkSeed("Implement feedback collector", "medium", "Ada", "todo", "KB-001"),
      mkSeed("Add NPS feedback to wallboard", "high", "Jules", "todo", "KB-002"),
      mkSeed("Add NPS feedback to email report", "high", "Mina", "todo", "KB-003"),
    ],
    doing: [
      mkSeed("Force SSL on any page that contains account info", "high", "Hugo", "doing", "KB-004"),
      mkSeed("Create subscription plans and discount codes", "medium", "Jules", "doing", "KB-005"),
    ],
    done: [
      mkSeed("Install SSL certificate", "low", "Ada", "done", "KB-006"),
    ],
  };

function mkSeed(title, priority, assignee, column, key) {
  return {
    id: uid(),
    key,
    title,
    description: "",
    priority,
    assignee: assignee || "",
    assigneeStyle: pickAssigneeStyle(assignee || ""),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    column,
  };
}

function pickAssigneeStyle(name) {
  // deterministic-ish style based on name length
  const n = (name || "").length % 4;
  if (n === 1) return "alt1";
  if (n === 2) return "alt2";
  if (n === 3) return "alt3";
  return "";
}

function isFiltering() {
  return ui.query.trim().length > 0 || ui.label !== "all";
}

// -------------------- filtering --------------------
function passesFilter(task) {
  const q = ui.query.trim().toLowerCase();
  const label = ui.label;

  if (label !== "all" && task.priority !== label) return false;
  if (!q) return true;

  const hay = `${task.title} ${task.description} ${task.key} ${task.assignee}`.toLowerCase();
  return hay.includes(q);
}

// -------------------- render --------------------
function setCounts(filtered) {
  counts.todo.textContent = String(filtered.todo.length);
  counts.doing.textContent = String(filtered.doing.length);
  counts.done.textContent = String(filtered.done.length);

  // WIP badge behavior
  if (filtered.doing.length > WIP_LIMIT_DOING) wipBadge.classList.add("breach");
  else wipBadge.classList.remove("breach");
}

function getFilteredState() {
  return {
    todo: state.todo.filter(passesFilter),
    doing: state.doing.filter(passesFilter),
    done: state.done.filter(passesFilter),
  };
}

function render() {
  const filtered = getFilteredState();

  // disable drag while filtering (avoids weird reordering bugs with hidden cards)
  const filtering = isFiltering();
  filterHint.hidden = !filtering;

  for (const col of ["todo", "doing", "done"]) {
    const list = lists[col];
    list.innerHTML = "";

    for (const task of filtered[col]) {
      const li = document.createElement("li");
      li.className = "card";
      li.dataset.taskId = task.id;
      li.dataset.column = col;
      li.draggable = !filtering;

      const desc = task.description?.trim()
        ? `<div class="card-desc">${escapeHTML(task.description)}</div>`
        : "";

      const initial = (task.assignee?.trim() || "U").slice(0, 1).toUpperCase();
      const assigneeClass = `assignee ${task.assigneeStyle || ""}`.trim();

      li.innerHTML = `
        <div class="card-top">
          <div class="card-title">${escapeHTML(task.title)}</div>
          <div class="card-actions">
            <button class="icon" data-action="edit" title="Edit" type="button">✎</button>
            <button class="icon" data-action="delete" title="Delete" type="button">🗑</button>
          </div>
        </div>
        ${desc}
        <div class="card-bottom">
          <div class="key">${escapeHTML(task.key)}</div>
          <div class="meta-right">
            <span class="dot ${task.priority}" title="Priority: ${task.priority}"></span>
            <span class="${assigneeClass}" title="${escapeHTML(task.assignee || "Unassigned")}">${escapeHTML(initial)}</span>
          </div>
        </div>
      `;

      attachDnDHandlers(li);
      list.appendChild(li);
    }
  }

  setCounts(filtered);
}

function attachDnDHandlers(cardEl) {
  cardEl.addEventListener("dragstart", (e) => {
    draggingId = cardEl.dataset.taskId;
    cardEl.classList.add("dragging");
    // for Firefox
    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", draggingId);
      e.dataTransfer.effectAllowed = "move";
    }
  });

  cardEl.addEventListener("dragend", () => {
    cardEl.classList.remove("dragging");
    if (!draggingId) return;

    syncStateFromDOM();

    // update timestamp for dragged task
    touchTask(draggingId);

    draggingId = null;
    saveState();
    render();
  });
}

// Allow drop / reorder
for (const col of ["todo", "doing", "done"]) {
  const list = lists[col];

  list.addEventListener("dragover", (e) => {
    if (isFiltering()) return; // disabled while filtering
    e.preventDefault();

    const dragging = document.querySelector(".card.dragging");
    if (!dragging) return;

    const afterEl = getDragAfterElement(list, e.clientY);
    if (afterEl == null) list.appendChild(dragging);
    else list.insertBefore(dragging, afterEl);
  });
}

function getDragAfterElement(container, y) {
  const cards = [...container.querySelectorAll(".card:not(.dragging)")];

  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

  for (const card of cards) {
    const box = card.getBoundingClientRect();
    const offset = y - (box.top + box.height / 2);
    if (offset < 0 && offset > closest.offset) {
      closest = { offset, element: card };
    }
  }
  return closest.element;
}

function flattenToMap() {
  const map = new Map();
  for (const col of ["todo", "doing", "done"]) {
    for (const task of state[col]) map.set(task.id, task);
  }
  return map;
}

function syncStateFromDOM() {
  const map = flattenToMap();

  for (const col of ["todo", "doing", "done"]) {
    const list = lists[col];
    const ids = [...list.querySelectorAll(".card")].map((el) => el.dataset.taskId);

    // Keep only tasks in DOM order; BUT if filtering is off, we should include all tasks.
    // Since we disabled DnD during filtering, DOM always represents full column.
    state[col] = ids.map((id) => map.get(id)).filter(Boolean);

    // stamp their column
    for (const task of state[col]) task.column = col;
  }
}

function touchTask(id) {
  for (const col of ["todo", "doing", "done"]) {
    const t = state[col].find((x) => x.id === id);
    if (t) {
      t.updatedAt = nowISO();
      t.column = col;
      return;
    }
  }
}

// -------------------- modal / CRUD --------------------
function openModal(mode, task = null, defaultColumn = "todo") {
  modalTitle.textContent = mode === "edit" ? "Edit task" : "Create task";

  taskIdEl.value = task?.id ?? "";
  taskColumnEl.value = task?.column ?? defaultColumn;

  titleInput.value = task?.title ?? "";
  descInput.value = task?.description ?? "";
  priorityInput.value = task?.priority ?? "medium";
  assigneeInput.value = task?.assignee ?? "";

  backdrop.hidden = false;
  modal.showModal();
  titleInput.focus();
}

function closeModal() {
  modal.close();
  backdrop.hidden = true;
  taskForm.reset();
  taskIdEl.value = "";
  taskColumnEl.value = "";
}

function addTask({ title, description, priority, assignee, column }) {
  const task = {
    id: uid(),
    key: nextKey(),
    title: title.trim(),
    description: description.trim(),
    priority,
    assignee: assignee.trim(),
    assigneeStyle: pickAssigneeStyle(assignee.trim()),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    column,
  };
  state[column].unshift(task);
  saveState();
  render();
}

function updateTask(id, patch) {
  for (const col of ["todo", "doing", "done"]) {
    const idx = state[col].findIndex((t) => t.id === id);
    if (idx >= 0) {
      const prev = state[col][idx];
      state[col][idx] = {
        ...prev,
        ...patch,
        updatedAt: nowISO(),
        assigneeStyle: pickAssigneeStyle(patch.assignee ?? prev.assignee),
      };
      saveState();
      render();
      return;
    }
  }
}

function moveTaskToColumn(id, targetColumn) {
  if (!["todo", "doing", "done"].includes(targetColumn)) return;

  for (const col of ["todo", "doing", "done"]) {
    const idx = state[col].findIndex((t) => t.id === id);
    if (idx >= 0) {
      const [task] = state[col].splice(idx, 1);
      task.column = targetColumn;
      task.updatedAt = nowISO();
      state[targetColumn].unshift(task);
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

// -------------------- events --------------------
addTaskBtn.addEventListener("click", () => openModal("add", null, "todo"));
floatingAdd.addEventListener("click", () => openModal("add", null, "todo"));

resetBtn.addEventListener("click", () => {
  const ok = confirm("Reset board? This will delete all tasks.");
  if (!ok) return;

  state.todo = [];
  state.doing = [];
  state.done = [];
  state.meta.seq = 0;

  ui.query = "";
  ui.label = "all";
  searchInput.value = "";
  priorityFilter.value = "all";

  saveState();
  render();
});

closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", closeModal);

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = taskIdEl.value.trim();
  const column = taskColumnEl.value || "todo";
  const title = titleInput.value;
  const description = descInput.value;
  const priority = priorityInput.value;
  const assignee = assigneeInput.value;

  if (!title.trim()) return;

  if (id) {
    updateTask(id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee: assignee.trim(),
    });
  } else {
    addTask({
      title,
      description,
      priority,
      assignee,
      column,
    });
  }

  closeModal();
});

// Add buttons at bottom of each column
document.querySelectorAll(".col-add").forEach((btn) => {
  btn.addEventListener("click", () => {
    const col = btn.dataset.addTo || "todo";
    openModal("add", null, col);
  });
});

// Card edit/delete delegation
document.querySelector(".board").addEventListener("click", (e) => {
  const actionBtn = e.target.closest("button[data-action]");
  if (!actionBtn) return;

  const card = actionBtn.closest(".card");
  if (!card) return;

  const id = card.dataset.taskId;
  const action = actionBtn.dataset.action;

  if (action === "delete") {
    const ok = confirm("Delete this task?");
    if (ok) deleteTask(id);
    return;
  }

  if (action === "edit") {
    const map = flattenToMap();
    const task = map.get(id);
    if (task) openModal("edit", task, task.column);
  }
});

// Search + label filter
searchInput.addEventListener("input", () => {
  ui.query = searchInput.value || "";
  render();
});

priorityFilter.addEventListener("change", () => {
  ui.label = priorityFilter.value || "all";
  render();
});

// Quick column move by double click (nice UX)
document.querySelector(".board").addEventListener("dblclick", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const id = card.dataset.taskId;

  // cycle todo -> doing -> done -> todo
  const map = flattenToMap();
  const t = map.get(id);
  if (!t) return;

  const next = t.column === "todo" ? "doing" : t.column === "doing" ? "done" : "todo";
  moveTaskToColumn(id, next);
  saveState();
  render();
});

// -------------------- init --------------------
saveState();
render();
