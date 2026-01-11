"use strict";

/**
 * Pro Kanban (Design 4) - Updated
 * - Safer DOM bindings (no crashes if IDs missing)
 * - Better drag sync: DOM controls status+order, tasks keep original fields
 * - Priority normalization so classes stay correct
 * - Safer unique IDs (randomUUID fallback)
 */

const STORAGE_KEY = "kanban_design4_data";
const columns = ["todo", "doing", "done"];

/* ---------------- Helpers ---------------- */
function $(id) {
  return document.getElementById(id);
}

function makeId() {
  // collision-safe id generation
  return (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function normalizePriority(p) {
  const x = String(p || "").trim().toLowerCase();
  if (x === "high") return "High";
  if (x === "low") return "Low";
  return "Medium";
}

function priorityClass(priority) {
  const map = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };
  return map[normalizePriority(priority)] || map.Medium;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------------- State ---------------- */
let tasks = loadTasks() || [
  { id: makeId(), content: "Drag me to another column!", priority: "High", status: "todo", order: 0 },
];

const els = {
  openModalBtn: $("openModalBtn"),
  modal: $("modal"),
  cancelBtn: $("cancelBtn"),
  createBtn: $("createBtn"),
  taskInput: $("taskInput"),
  priorityInput: $("priorityInput"),
  todo: $("todo"),
  doing: $("doing"),
  done: $("done"),
};

/* ---------------- Storage ---------------- */
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
        content: String(t.content ?? ""),
        priority: normalizePriority(t.priority),
        status: columns.includes(t.status) ? t.status : "todo",
        order: Number.isFinite(t.order) ? t.order : 0,
      }))
      .filter((t) => t.content.trim().length > 0);
  } catch {
    return null;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
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
function renderTasks() {
  // ensure columns exist
  for (const col of columns) {
    const el = $(col);
    if (el) el.innerHTML = "";
  }

  const byStatus = { todo: [], doing: [], done: [] };
  for (const t of tasks) {
    if (!byStatus[t.status]) continue;
    byStatus[t.status].push(t);
  }

  for (const status of columns) {
    byStatus[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const colEl = $(status);
    if (!colEl) continue;

    for (const task of byStatus[status]) {
      const taskEl = document.createElement("div");
      taskEl.className =
        "bg-white p-4 mb-3 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors";
      taskEl.dataset.id = task.id;

      const pClass = priorityClass(task.priority);

      taskEl.innerHTML = `
        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${pClass}">
          ${escapeHtml(normalizePriority(task.priority))}
        </span>

        <p class="mt-2 text-slate-700 font-medium">${escapeHtml(task.content)}</p>

        <div class="flex justify-end mt-2">
          <button class="text-slate-400 hover:text-red-500 text-xs" type="button"
                  data-action="delete" data-id="${escapeHtml(task.id)}">
            Delete
          </button>
        </div>
      `;

      colEl.appendChild(taskEl);
    }
  }
}

/**
 * After drag/drop, DOM order becomes truth for status+order only.
 * Keep original content/priority in tasks state.
 */
function syncFromDOM() {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const updated = [];

  for (const status of columns) {
    const colEl = $(status);
    if (!colEl) continue;

    const cards = [...colEl.querySelectorAll("[data-id]")];

    cards.forEach((card, idx) => {
      const id = String(card.getAttribute("data-id") || "");
      const existing = taskMap.get(id);

      // If somehow a card exists with no matching task, rebuild safely from DOM
      if (!existing) {
        const content = card.querySelector("p")?.innerText ?? "";
        const priority = normalizePriority(card.querySelector("span")?.innerText ?? "Medium");
        updated.push({ id, content, priority, status, order: idx });
        return;
      }

      updated.push({
        ...existing,
        status,
        order: idx,
      });
    });
  }

  tasks = updated;
  saveTasks();
}

/* ---------------- Sortable ---------------- */
function initSortable() {
  // guard if Sortable missing
  if (typeof Sortable === "undefined") return;

  columns.forEach((id) => {
    const el = $(id);
    if (!el) return;

    new Sortable(el, {
      group: "kanban",
      animation: 150,
      ghostClass: "ghost-card",
      onEnd: () => {
        syncFromDOM();
        renderTasks();
      },
    });
  });
}

/* ---------------- Actions ---------------- */
function addTask() {
  const content = (els.taskInput?.value || "").trim();
  const priority = normalizePriority(els.priorityInput?.value || "Medium");
  if (!content) return;

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
  renderTasks();
  closeModal();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);

  // re-normalize order inside each column
  const by = { todo: [], doing: [], done: [] };
  for (const t of tasks) {
    if (by[t.status]) by[t.status].push(t);
  }

  for (const status of columns) {
    by[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    by[status].forEach((t, idx) => (t.order = idx));
  }

  tasks = [...by.todo, ...by.doing, ...by.done];
  saveTasks();
  renderTasks();
}

/* ---------------- Events ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderTasks();
  initSortable();
});

// Bind only if elements exist
els.openModalBtn?.addEventListener("click", openModal);
els.cancelBtn?.addEventListener("click", closeModal);
els.createBtn?.addEventListener("click", addTask);

els.taskInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && els.modal && !els.modal.classList.contains("hidden")) closeModal();
});

// Click outside modal content closes (only if click is on overlay)
els.modal?.addEventListener("click", (e) => {
  if (e.target === els.modal) closeModal();
});

// Delete (event delegation)
document.addEventListener("click", (e) => {
  const btn = e.target.closest?.("[data-action='delete']");
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  if (!id) return;

  const ok = confirm("Delete this task?");
  if (!ok) return;

  deleteTask(String(id));
});
