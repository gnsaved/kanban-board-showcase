"use strict";

/**
 * Pro Kanban (Design 4)
 * - Tailwind (CDN) + SortableJS
 * - Drag across columns + reorder within column
 * - LocalStorage persistence INCLUDING order + status
 * - No inline onclick; uses event listeners
 */

const STORAGE_KEY = "kanban_design4_data";

const columns = ["todo", "doing", "done"];

const els = {
  openModalBtn: document.getElementById("openModalBtn"),
  modal: document.getElementById("modal"),
  cancelBtn: document.getElementById("cancelBtn"),
  createBtn: document.getElementById("createBtn"),
  taskInput: document.getElementById("taskInput"),
  priorityInput: document.getElementById("priorityInput"),
  todo: document.getElementById("todo"),
  doing: document.getElementById("doing"),
  done: document.getElementById("done"),
};

let tasks = loadTasks() || [
  { id: String(Date.now()), content: "Drag me to another column!", priority: "High", status: "todo", order: 0 },
];

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function openModal() {
  els.modal.classList.remove("hidden");
  els.modal.setAttribute("aria-hidden", "false");
  setTimeout(() => els.taskInput.focus(), 0);
}

function closeModal() {
  els.modal.classList.add("hidden");
  els.modal.setAttribute("aria-hidden", "true");
  els.taskInput.value = "";
  els.priorityInput.value = "Medium";
}

function priorityClass(priority) {
  const map = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };
  return map[priority] || map.Medium;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTasks() {
  columns.forEach((col) => (document.getElementById(col).innerHTML = ""));

  const byStatus = { todo: [], doing: [], done: [] };
  for (const t of tasks) {
    if (!byStatus[t.status]) continue;
    byStatus[t.status].push(t);
  }

  for (const status of columns) {
    byStatus[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const task of byStatus[status]) {
      const taskEl = document.createElement("div");
      taskEl.className =
        "bg-white p-4 mb-3 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors";
      taskEl.dataset.id = task.id;

      const pClass = priorityClass(task.priority);

      taskEl.innerHTML = `
        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${pClass}">
          ${escapeHtml(task.priority)}
        </span>

        <p class="mt-2 text-slate-700 font-medium">${escapeHtml(task.content)}</p>

        <div class="flex justify-end mt-2">
          <button class="text-slate-400 hover:text-red-500 text-xs" type="button" data-action="delete" data-id="${escapeHtml(task.id)}">
            Delete
          </button>
        </div>
      `;

      document.getElementById(task.status).appendChild(taskEl);
    }
  }
}

/**
 * After drag/drop, DOM order becomes truth:
 * - read each column in order
 * - write back to tasks[] with status + order
 */
function syncFromDOM() {
  const updated = [];

  for (const status of columns) {
    const colEl = document.getElementById(status);
    const cards = [...colEl.querySelectorAll("[data-id]")];

    cards.forEach((card, idx) => {
      const id = card.getAttribute("data-id");
      const existing = tasks.find((t) => t.id === id);

      // fallback read from DOM (safe if needed)
      const content = card.querySelector("p")?.innerText ?? existing?.content ?? "";
      const priority = card.querySelector("span")?.innerText ?? existing?.priority ?? "Medium";

      updated.push({
        id: String(id),
        content: String(content),
        priority: String(priority),
        status,
        order: idx,
      });
    });
  }

  tasks = updated;
  saveTasks();
}

function initSortable() {
  columns.forEach((id) => {
    new Sortable(document.getElementById(id), {
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

function addTask() {
  const content = (els.taskInput.value || "").trim();
  const priority = els.priorityInput.value;

  if (!content) return;

  const todoOrders = tasks.filter((t) => t.status === "todo").map((t) => t.order ?? 0);
  const nextOrder = todoOrders.length ? Math.max(...todoOrders) + 1 : 0;

  tasks.push({
    id: String(Date.now()),
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
  for (const t of tasks) by[t.status].push(t);

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

els.openModalBtn.addEventListener("click", openModal);
els.cancelBtn.addEventListener("click", closeModal);
els.createBtn.addEventListener("click", addTask);

els.taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modal.classList.contains("hidden")) closeModal();
});

// Click outside modal content closes (only if click is on overlay)
els.modal.addEventListener("click", (e) => {
  if (e.target === els.modal) closeModal();
});

// Delete (event delegation)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action='delete']");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  if (!id) return;

  const ok = confirm("Delete this task?");
  if (!ok) return;

  deleteTask(id);
});
