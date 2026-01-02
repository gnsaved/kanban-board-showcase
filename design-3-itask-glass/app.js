"use strict";

/**
 * iTask Kanban (Design 3)
 * - Sortable drag & drop across columns
 * - Saves tasks to LocalStorage
 * - Saves ORDER properly after dragging (not just status)
 * - Clean event listeners (no inline onclick)
 */

const STORAGE_KEY = "itask_design3_data";

const els = {
  modal: document.getElementById("modal"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  openModalBtn: document.getElementById("openModalBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  addTaskBtn: document.getElementById("addTaskBtn"),
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

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

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

function openModal() {
  els.modal.classList.remove("hidden");
  setTimeout(() => els.taskInput.focus(), 0);
}

function closeModal() {
  els.modal.classList.add("hidden");
  els.taskInput.value = "";
  els.priorityInput.value = "Medium";
}

function priorityBadgeClass(priority) {
  const map = {
    High: "text-rose-500 bg-rose-50",
    Medium: "text-amber-500 bg-amber-50",
    Low: "text-emerald-500 bg-emerald-50",
  };
  return map[priority] || map.Low;
}

function render() {
  // Clear columns
  els.todo.innerHTML = "";
  els.doing.innerHTML = "";
  els.done.innerHTML = "";

  // Sort by status then order
  const byStatus = {
    todo: [],
    doing: [],
    done: [],
  };

  for (const t of tasks) {
    if (!byStatus[t.status]) continue;
    byStatus[t.status].push(t);
  }

  for (const status of ["todo", "doing", "done"]) {
    byStatus[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    for (const task of byStatus[status]) {
      const card = document.createElement("div");
      card.className =
        "ios-card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-grab relative group";
      card.setAttribute("data-id", task.id);

      const pClass = priorityBadgeClass(task.priority);

      card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${pClass}">
            ${escapeHtml(task.priority)}
          </span>

          <button
            class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500 p-1"
            type="button"
            data-action="delete"
            data-id="${escapeHtml(task.id)}"
            aria-label="Delete task"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="text-slate-700 font-medium leading-relaxed">${escapeHtml(task.content)}</p>
      `;

      const container =
        status === "todo" ? els.todo : status === "doing" ? els.doing : els.done;

      container.appendChild(card);
    }
  }

  updateCounts();
}

function updateCounts() {
  els.todoCount.textContent = String(tasks.filter((t) => t.status === "todo").length);
  els.doingCount.textContent = String(tasks.filter((t) => t.status === "doing").length);
  els.doneCount.textContent = String(tasks.filter((t) => t.status === "done").length);
}

function addTask() {
  const content = (els.taskInput.value || "").trim();
  const priority = els.priorityInput.value;

  if (!content) return;

  const id = String(Date.now());

  // Place new task at bottom of "todo" by order
  const todoOrders = tasks.filter((t) => t.status === "todo").map((t) => t.order ?? 0);
  const nextOrder = todoOrders.length ? Math.max(...todoOrders) + 1 : 0;

  tasks.push({
    id,
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
  normalizeOrders();
  saveTasks();
  render();
}

function normalizeOrders() {
  // Rebuild order per column based on DOM order (source of truth after drag)
  const colMap = {
    todo: els.todo,
    doing: els.doing,
    done: els.done,
  };

  for (const status of ["todo", "doing", "done"]) {
    const nodes = [...colMap[status].querySelectorAll("[data-id]")];
    nodes.forEach((node, idx) => {
      const id = node.getAttribute("data-id");
      const t = tasks.find((x) => x.id === id);
      if (t) {
        t.status = status;
        t.order = idx;
      }
    });
  }
}

function initSortable() {
  const cols = document.querySelectorAll(".kanban-col");

  cols.forEach((col) => {
    new Sortable(col, {
      group: "shared",
      animation: 150,
      ghostClass: "sortable-ghost",
      dragClass: "sortable-drag",
      delay: 100,
      delayOnTouchOnly: true,

      onEnd: () => {
        normalizeOrders();
        saveTasks();
        updateCounts();
      },
    });
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ------------------ Events ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  render();
  initSortable();
});

// Modal open/close
els.openModalBtn.addEventListener("click", openModal);
els.cancelBtn.addEventListener("click", closeModal);
els.modalBackdrop.addEventListener("click", closeModal);

// Keyboard: ESC closes
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modal.classList.contains("hidden")) {
    closeModal();
  }
});

// Add task
els.addTaskBtn.addEventListener("click", addTask);
els.taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// Delete task (event delegation)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action='delete']");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  if (id) deleteTask(id);
});
