let tasks = [];
let intervals = {};

window.onload = function () {
  const stored = localStorage.getItem("tasks");
  if (stored) {
    tasks = JSON.parse(stored);
    tasks.forEach(task => {
      if (task.isRunning) {
        const timePassed = Math.floor((Date.now() - task.lastStart) / 1000);
        task.timeSpent += timePassed;
        task.lastStart = Date.now();
        startTask(task);
      }
    });
  }
  renderTasks();
};

function addTask() {
  const name = document.getElementById("taskName").value.trim();
  if (!name) return alert("Please enter task name");

  tasks.forEach(task => {
    if (task.isRunning) pauseTask(task);
  });

  const task = {
    id: Date.now(),
    name,
    timeSpent: 0,
    isRunning: true,
    lastStart: Date.now()
  };

  tasks.push(task);
  startTask(task);
  saveTasks();
  renderTasks();
  document.getElementById("taskName").value = "";
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  if (!task.isRunning) {
    tasks.forEach(t => {
      if (t.id !== id && t.isRunning) pauseTask(t);
    });

    task.lastStart = Date.now();
    task.isRunning = true;
    startTask(task);
  } else {
    pauseTask(task);
  }

  saveTasks();
  renderTasks();
}

function startTask(task) {
  intervals[task.id] = setInterval(() => {
    const now = Date.now();
    const seconds = Math.floor((now - task.lastStart) / 1000);
    task.timeSpent += seconds;
    task.lastStart = now;
    saveTasks();
    renderTasks();
  }, 1000);
}

function pauseTask(task) {
  task.isRunning = false;
  clearInterval(intervals[task.id]);
  intervals[task.id] = null;
}

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateTotalTime() {
  const total = tasks.reduce((acc, task) => acc + task.timeSpent, 0);
  const hours = (total / 3600).toFixed(2);
  const totalTimeDiv = document.getElementById("totalTime");

  if (totalTimeDiv) {
    totalTimeDiv.textContent = `Total Time Spent: ${formatTime(total)} (${hours} hrs)`;
  }
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task";
    div.innerHTML = `
      <div><strong>${task.name}</strong></div>
      <div>${formatTime(task.timeSpent)} (${(task.timeSpent / 3600).toFixed(2)} hrs)</div>
      <div>
        <button onclick="toggleTask(${task.id})">
          ${task.isRunning ? "Pause" : "Resume"}
        </button>
        <button onclick="editTask(${task.id})">Edit</button>
        <button onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;
    taskList.appendChild(div);
  });

  updateTotalTime();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newName = prompt("Edit Task Name:", task.name);
  if (newName && newName.trim()) {
    task.name = newName.trim();
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    clearInterval(intervals[tasks[index].id]);
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}

document.getElementById("taskName").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    addTask();
  }
});

function downloadCSV() {
  let csv = "Task Name,Time Spent (hours)\n";
  tasks.forEach(task => {
    const hours = (task.timeSpent / 3600).toFixed(2);
    csv += `${task.name},${hours}\n`;
  });

  // Create date object in IST (UTC+5:30)
  const now = new Date();
  const utcOffset = now.getTimezoneOffset(); // in minutes
  const istOffset = 330; // IST is UTC+5:30 → 330 minutes
  const istTime = new Date(now.getTime() + (istOffset - utcOffset) * 60000);

  let shiftDate = new Date(istTime);
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();

  // If current IST time is between 00:00 and 05:29, use previous day
  if (hours < 5 || (hours === 5 && minutes < 30)) {
    shiftDate.setDate(shiftDate.getDate() - 1);
  }

  const yyyy = shiftDate.getFullYear();
  const mm = String(shiftDate.getMonth() + 1).padStart(2, '0');
  const dd = String(shiftDate.getDate()).padStart(2, '0');
  const dateString = `${yyyy}-${mm}-${dd}`;

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `task_time_log_${dateString}.csv`;
  link.click();
}
