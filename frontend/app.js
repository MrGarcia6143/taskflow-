// ── Config ────────────────────────────────────────────────────────────────────
// Cambia esta URL por la URL de tu backend en Render cuando lo despliegues.
// En desarrollo local usa: http://localhost:3000
const API_URL = window.ENV_API_URL || "http://localhost:3000";

// ── State ─────────────────────────────────────────────────────────────────────
let tasks = [];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const taskInput    = document.getElementById("task-input");
const addBtn       = document.getElementById("add-btn");
const taskList     = document.getElementById("task-list");
const taskCount    = document.getElementById("task-count");
const clearDoneBtn = document.getElementById("clear-done-btn");
const emptyState   = document.getElementById("empty-state");
const toast        = document.getElementById("toast");

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = "default") {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast show${type === "error" ? " error" : ""}`;
  toastTimer = setTimeout(() => { toast.className = "toast"; }, 2800);
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || "Error del servidor");
  }
  // 204 No Content no tiene body
  if (res.status === 204) return null;
  return res.json();
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const pendingCount = tasks.filter(t => !t.done).length;
  const doneCount    = tasks.filter(t => t.done).length;

  taskCount.textContent =
    pendingCount === 0
      ? "Todo listo ✦"
      : `${pendingCount} tarea${pendingCount !== 1 ? "s" : ""} pendiente${pendingCount !== 1 ? "s" : ""}`;

  clearDoneBtn.style.display = doneCount > 0 ? "block" : "none";

  // Remove all task items (keep empty state)
  taskList.querySelectorAll(".task-item").forEach(el => el.remove());

  if (tasks.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  tasks.forEach(task => {
    const item = document.createElement("div");
    item.className = `task-item${task.done ? " done" : ""}`;
    item.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Marcar "${task.title}" como completada`);
    checkbox.addEventListener("change", () => toggleTask(task.id, checkbox.checked));

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", `Eliminar "${task.title}"`);
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5L11 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, title, deleteBtn);
    taskList.appendChild(item);
  });
}

// ── Skeleton loading ──────────────────────────────────────────────────────────
function showSkeletons(n = 3) {
  emptyState.style.display = "none";
  for (let i = 0; i < n; i++) {
    const sk = document.createElement("div");
    sk.className = "skeleton";
    taskList.appendChild(sk);
  }
}

// ── Fetch all tasks ───────────────────────────────────────────────────────────
async function loadTasks() {
  showSkeletons(3);
  try {
    tasks = await apiFetch("/tasks");
    render();
  } catch (e) {
    taskList.querySelectorAll(".skeleton").forEach(el => el.remove());
    emptyState.style.display = "block";
    showToast("No se pudo conectar con el servidor.", "error");
  }
}

// ── Add task ──────────────────────────────────────────────────────────────────
async function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }

  addBtn.disabled = true;
  taskInput.disabled = true;

  try {
    const newTask = await apiFetch("/tasks", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    tasks.unshift(newTask);
    taskInput.value = "";
    render();
    showToast("Tarea agregada ✓");
  } catch (e) {
    showToast(e.message, "error");
  } finally {
    addBtn.disabled = false;
    taskInput.disabled = false;
    taskInput.focus();
  }
}

// ── Toggle done ───────────────────────────────────────────────────────────────
async function toggleTask(id, done) {
  const original = tasks.find(t => t.id === id);
  // Optimistic update
  original.done = done;
  render();

  try {
    const updated = await apiFetch(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ done }),
    });
    Object.assign(original, updated);
    render();
  } catch (e) {
    original.done = !done;   // revert
    render();
    showToast("No se pudo actualizar.", "error");
  }
}

// ── Delete task ───────────────────────────────────────────────────────────────
async function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  const [removed] = tasks.splice(index, 1);
  render();

  try {
    await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    showToast("Tarea eliminada");
  } catch (e) {
    tasks.splice(index, 0, removed);  // revert
    render();
    showToast("No se pudo eliminar.", "error");
  }
}

// ── Clear done ────────────────────────────────────────────────────────────────
async function clearDone() {
  const doneTasks = tasks.filter(t => t.done);
  if (doneTasks.length === 0) return;

  tasks = tasks.filter(t => !t.done);
  render();

  try {
    await Promise.all(doneTasks.map(t => apiFetch(`/tasks/${t.id}`, { method: "DELETE" })));
    showToast(`${doneTasks.length} tarea${doneTasks.length > 1 ? "s" : ""} eliminada${doneTasks.length > 1 ? "s" : ""}`);
  } catch (e) {
    tasks = [...tasks, ...doneTasks];
    render();
    showToast("Error al limpiar tareas.", "error");
  }
}

// ── Events ────────────────────────────────────────────────────────────────────
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", e => { if (e.key === "Enter") addTask(); });
clearDoneBtn.addEventListener("click", clearDone);

// ── Init ──────────────────────────────────────────────────────────────────────
loadTasks();
