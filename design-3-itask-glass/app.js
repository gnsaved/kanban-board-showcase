"use strict";

/**
 * iTask Kanban (Design 3) - Updated
 * - Sortable drag & drop across columns
 * - Saves tasks to LocalStorage
 * - Saves ORDER properly after dragging (not just status)
 * - Clean event listeners (no inline onclick)
 * - Safer DOM guards + priority normalization + collision-safe IDs
 * - Backdrop click closes modal + aria-hidden toggled
 */

const STORAGE_KEY = "itask_design3_data";
const columns = ["todo", "doing", "done"];

const els = {
  modal: document.getElementById("modal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  openModalBtn: document.getElementById("openModalBtn"),
  cancelBtn: document.getElementById("cancelBtn"),

  // IMPORTANT: matches your updated HTML (createBtn)
  createBtn: document.getElementById("createBtn"),

  taskInput: document.getElementById("taskInput"),
  priorityInput: document.getElementById("priorityInput"),

  todo: document.getElementById("todo"),
  doing: document.getElementById("doing"),
  done: document.getElementById("done"),

  todoCount: document.getElementById("todo-count"),
  doingCount: document.getElementById("doing-count"),
  doneCount: document.getElementById("done-count"),
};

let tasks = loadTasks() || [
  { id: "1", content: "Design System", priority: "High", status: "todo", order: 0 },
  { id: "2", content: "Integration API", priority: "Medium", status: "doing", order: 0 },
  { id: "3", content: "Launch v1.0", priority: "Low", status: "done", order: 0 },
];

/* ---------------- Helpers ---------------- */
function normalizePriority(p) {
  const x = String(p || "").trim().toLowerCase();
  if (x === "high") return "High";
  if (x === "low") return "Low";
  return "Medium";
}

function makeId() {
  return (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function priorityBadgeClass(priority) {
  const map = {
    High: "text-rose-500 bg-rose-50",
    Medium: "text-amber-500 bg-amber-50",
    Low: "text-emerald-500 bg-emerald-50",
  };
  return map[normalizePriority(priority)] || map.Medium;
}

/* ---------------- Storage ---------------- */
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    // sanitize + normalize
    return parsed
      .map((t) => ({
        id: String(t.id ?? makeId()),
        content: String(t.content ?? "").trim(),
        priority: normalizePriority(t.priority),
        status: columns.includes(t.status) ? t.status : "todo",
        order: Number.isFinite(t.order) ? t.order : 0,
      }))
      .filter((t) => t.content.length > 0);
  } catch {
    return null;
  }
}

/* ---------------- Modal ---------------- */
function openModal() {
  if (!els.modal) return;
  els.modal.classList.remove("hidden");
  els.modal.setAttribute("aria-hidden", "false");
  setTimeout(() => els.taskInput?.focus(), 0);
}

function closeModal() {
  if (!els.modal) return;
  els.modal.classList.add("hidden");
  els.modal.setAttribute("aria-hidden", "true");
  if (els.taskInput) els.taskInput.value = "";
  if (els.priorityInput) els.priorityInput.value = "Medium";
}

/* ---------------- Render ---------------- */
function render() {
  // Guard required elements
  if (!els.todo || !els.doing || !els.done) return;

  // Clear columns
  els.todo.innerHTML = "";
  els.doing.innerHTML = "";
  els.done.innerHTML = "";

  // Group by status
  const byStatus = { todo: [], doing: [], done: [] };

  for (const t of tasks) {
    if (!byStatus[t.status]) continue;
    byStatus[t.status].push(t);
  }

  // Render each status by order
  for (const status of columns) {
    byStatus[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const container = status === "todo" ? els.todo : status === "doing" ? els.doing : els.done;

    for (const task of byStatus[status]) {
      const card = document.createElement("div");
      card.className =
        "ios-card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-grab relative group";
      card.setAttribute("data-id", task.id);

      const pClass = priorityBadgeClass(task.priority);

      card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${pClass}">
            ${escapeHtml(normalizePriority(task.priority))}
          </span>

          <button
            class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500 p-1"
            type="button"
            data-action="delete"
            data-id="${escapeHtml(task.id)}"
            aria-label="Delete task"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                 stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="text-slate-700 font-medium leading-relaxed">${escapeHtml(task.content)}</p>
      `;

      container.appendChild(card);
    }
  }

  updateCounts();
}

function updateCounts() {
  if (els.todoCount) els.todoCount.textContent = String(tasks.filter((t) => t.status === "todo").length);
  if (els.doingCount) els.doingCount.textContent = String(tasks.filter((t) => t.status === "doing").length);
  if (els.doneCount) els.doneCount.textContent = String(tasks.filter((t) => t.status === "done").length);
}

/* ---------------- Actions ---------------- */
function addTask() {
  const content = (els.taskInput?.value || "").trim();
  const priority = normalizePriority(els.priorityInput?.value || "Medium");

  if (!content) return;

  // Place new task at bottom of "todo"
  const todoOrders = tasks.filter((t) => t.status === "todo").map((t) => t.order ?? 0);
  const nextOrder = todoOrders.length ? Math.max(...todoOrders) + 1 : 0;

  tasks.push({
    id: makeId(),
    content,
    priority,
    status: "todo",
    order: nextOrder,
  });

  saveTasks();
  render();
  closeModal();
}

function deleteTask(id) {
  const ok = confirm("Delete this task?");
  if (!ok) return;

  tasks = tasks.filter((t) => t.id !== id);
  renormalizeOrdersByStatus();
  saveTasks();
  render();
}

/**
 * After drag/drop:
 * - DOM is truth for order and status
 * - update tasks accordingly, preserve content/priority
 */
function syncFromDOM() {
  if (!els.todo || !els.doing || !els.done) return;

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const updated = [];

  const colMap = { todo: els.todo, doing: els.doing, done: els.done };

  for (const status of columns) {
    const nodes = [...colMap[status].querySelectorAll("[data-id]")];

    nodes.forEach((node, idx) => {
      const id = String(node.getAttribute("data-id") || "");
      const existing = taskMap.get(id);

      if (!existing) {
        // Fallback if DOM contains unknown card
        const content = node.querySelector("p")?.innerText ?? "";
        const priority = normalizePriority(node.querySelector("span")?.innerText ?? "Medium");
        updated.push({ id, content: String(content).trim(), priority, status, order: idx });
        return;
      }

      updated.push({
        ...existing,
        status,
        order: idx,
        priority: normalizePriority(existing.priority),
      });
    });
  }

  tasks = updated;
}

function renormalizeOrdersByStatus() {
  const by = { todo: [], doing: [], done: [] };

  for (const t of tasks) {
    if (!by[t.status]) continue;
    by[t.status].push(t);
  }

  for (const status of columns) {
    by[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    by[status].forEach((t, idx) => (t.order = idx));
  }

  tasks = [...by.todo, ...by.doing, ...by.done];
}

/* ---------------- Sortable ---------------- */
function initSortable() {
  if (typeof Sortable === "undefined") return;

  const cols = document.querySelectorAll(".kanban-col");

  cols.forEach((col) => {
    new Sortable(col, {
      group: "shared",
      animation: 150,

      // Your CSS supports both; use ghost-card for your custom style
      ghostClass: "ghost-card",
      dragClass: "sortable-drag",

      delay: 100,
      delayOnTouchOnly: true,

      onEnd: () => {
        syncFromDOM();
        saveTasks();
        render(); // ensures UI + counts stay correct
      },
    });
  });
}

/* ---------------- Events ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  render();
  initSortable();
});

// Modal open/close (guarded)
els.openModalBtn?.addEventListener("click", openModal);
els.cancelBtn?.addEventListener("click", closeModal);
els.modalBackdrop?.addEventListener("click", closeModal);

// Keyboard: ESC closes
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && els.modal && !els.modal.classList.contains("hidden")) {
    closeModal();
  }
});

// Add task (button + Enter)
els.createBtn?.addEventListener("click", addTask);
els.taskInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// Delete task (event delegation)
document.addEventListener("click", (e) => {
  const btn = e.target.closest?.("[data-action='delete']");
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  if (id) deleteTask(String(id));
});
