
const form = document.getElementById("activityForm");
const activityDate = document.getElementById("activityDate");
const activityList = document.getElementById("activityList");
const formMessage = document.getElementById("formMessage");

const STORAGE_KEY = "fitTrackActivities";

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const today = getLocalDate();

document.getElementById("todayDate").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

activityDate.value = today;
activityDate.max = today;

function loadActivities() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let activities = loadActivities();

function saveActivities() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    return true;
  } catch {
    showMessage("Unable to save data in this browser.", true);
    return false;
  }
}

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

function setProgress(id, value, goal) {
  const percent = Math.min((value / goal) * 100, 100);
  document.getElementById(id).style.width = `${percent}%`;
  return Math.round(percent);
}

function updateDashboard() {
  const todaysActivities = activities.filter(
    activity => activity.date === today
  );

  const steps = todaysActivities.reduce(
    (sum, item) => sum + item.steps, 0
  );

  const calories = todaysActivities.reduce(
    (sum, item) => sum + item.calories, 0
  );

  const duration = todaysActivities.reduce(
    (sum, item) => sum + item.duration, 0
  );

  document.getElementById("stepsTotal").textContent =
    steps.toLocaleString("en-IN");

  document.getElementById("caloriesTotal").textContent =
    calories.toLocaleString("en-IN");

  document.getElementById("timeTotal").textContent =
    duration.toLocaleString("en-IN");

  const stepsPercent = setProgress("stepsBar", steps, 10000);
  setProgress("caloriesBar", calories, 500);
  setProgress("timeBar", duration, 60);

  document.getElementById("stepsPercent").textContent =
    `${stepsPercent}% of goal`;

  document.getElementById("goalSteps").textContent =
    `${steps.toLocaleString("en-IN")} / 10,000`;

  document.getElementById("goalCalories").textContent =
    `${calories.toLocaleString("en-IN")} / 500 kcal`;

  document.getElementById("goalTime").textContent =
    `${duration.toLocaleString("en-IN")} / 60 min`;

  setProgress("goalStepsBar", steps, 10000);
  setProgress("goalCaloriesBar", calories, 500);
  setProgress("goalTimeBar", duration, 60);

  renderHistory();
}

function renderHistory() {
  activityList.replaceChildren();

  const sorted = [...activities].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id - a.id;
  });

  document.getElementById("activityCount").textContent =
    `${activities.length} ${activities.length === 1 ? "activity" : "activities"}`;

  if (sorted.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-person-walking";

    const message = document.createElement("p");
    message.textContent = "No activities yet. Add your first workout!";

    empty.append(icon, message);
    activityList.appendChild(empty);
    return;
  }

  sorted.forEach(activity => {
    const item = document.createElement("article");
    item.className = "activity-item";

    const info = document.createElement("div");
    info.className = "activity-info";

    const name = document.createElement("h3");
    name.textContent = `🏃 ${activity.workout}`;

    const date = document.createElement("p");
    date.textContent = new Date(
      `${activity.date}T12:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    const metrics = document.createElement("div");
    metrics.className = "activity-metrics";
    metrics.textContent =
      `${activity.steps.toLocaleString("en-IN")} steps · ` +
      `${activity.duration} min · ${activity.calories} kcal`;

    info.append(name, date, metrics);

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.title = "Delete activity";
    deleteButton.setAttribute("aria-label", `Delete ${activity.workout}`);

    const deleteIcon = document.createElement("i");
    deleteIcon.className = "fa-solid fa-trash";
    deleteButton.appendChild(deleteIcon);

    deleteButton.addEventListener("click", () => {
      const confirmed = confirm("Delete this activity?");
      if (!confirmed) return;

      const previous = activities;
      activities = activities.filter(
        entry => entry.id !== activity.id
      );

      if (saveActivities()) {
        updateDashboard();
        showMessage("Activity deleted successfully.");
      } else {
        activities = previous;
        updateDashboard();
      }
    });

    item.append(info, deleteButton);
    activityList.appendChild(item);
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const date = activityDate.value;
  const steps = Number(document.getElementById("steps").value);
  const workout = document.getElementById("workout").value;
  const duration = Number(document.getElementById("duration").value);
  const calories = Number(document.getElementById("calories").value);

  if (!date || date > today) {
    showMessage("Please select today or an earlier date.", true);
    return;
  }

  if (
    !workout ||
    !Number.isSafeInteger(steps) || steps < 0 ||
    !Number.isSafeInteger(duration) || duration < 1 ||
    !Number.isSafeInteger(calories) || calories < 0
  ) {
    showMessage("Enter valid values in all fields.", true);
    return;
  }

  const activity = {
    id: Date.now(),
    date,
    steps,
    workout,
    duration,
    calories
  };

  activities.push(activity);

  if (!saveActivities()) {
    activities.pop();
    return;
  }

  updateDashboard();
  form.reset();
  activityDate.value = today;
  showMessage("🎉 Activity added successfully!");
});

updateDashboard();

