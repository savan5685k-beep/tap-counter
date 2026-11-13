const $ = id => document.getElementById(id);

const defaults = {
  count: 0,
  best: 0,
  target: 100,
  theme: "dark",
  vibration: true,
  sound: false,
  animation: true,
  history: []
};

let data = { ...defaults, ...JSON.parse(localStorage.getItem("tap-counter-data") || "{}") };
let undoStack = [];

function save() {
  localStorage.setItem("tap-counter-data", JSON.stringify(data));
}

function render() {
  $("count").textContent = data.count.toLocaleString();
  $("best").textContent = data.best.toLocaleString();
  $("target").textContent = data.target.toLocaleString();

  document.body.classList.toggle("light", data.theme === "light");
  $("theme-btn").textContent = data.theme === "light" ? "DARK" : "LIGHT";

  $("target-message").textContent =
    data.target > 0 && data.count >= data.target
      ? "TARGET COMPLETED"
      : "";
}

function feedback() {
  if (data.vibration && navigator.vibrate) {
    navigator.vibrate(15);
  }

  if (data.sound) {
    try {
      const audio = new AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.frequency.value = 650;
      gain.gain.value = 0.035;

      oscillator.connect(gain);
      gain.connect(audio.destination);

      oscillator.start();
      oscillator.stop(audio.currentTime + 0.04);
      oscillator.onended = () => audio.close();
    } catch (error) {}
  }
}

function animateNumber() {
  if (!data.animation) return;

  $("count").classList.remove("pop");
  void $("count").offsetWidth;
  $("count").classList.add("pop");
}

function increment() {
  undoStack.push(data.count);
  if (undoStack.length > 100) undoStack.shift();

  data.count++;

  if (data.count > data.best) {
    data.best = data.count;
  }

  save();
  render();
  animateNumber();
  feedback();
}

// Full screen counting
$("tap-area").addEventListener("click", event => {
  if (event.target.closest("button, .modal")) return;
  increment();
});

// Theme
$("theme-btn").addEventListener("click", () => {
  data.theme = data.theme === "dark" ? "light" : "dark";
  save();
  render();
});

// Undo
$("undo").addEventListener("click", () => {
  if (!undoStack.length) return;

  data.count = undoStack.pop();
  save();
  render();
});

// History
function saveSession() {
  if (data.count === 0) return;

  data.history.unshift({
    count: data.count,
    date: new Date().toLocaleString()
  });

  data.history = data.history.slice(0, 30);
}

// Reset
$("reset").addEventListener("click", () => {
  if (data.count === 0) return;

  if (!confirm("Reset your current counting?")) return;

  saveSession();
  data.count = 0;
  undoStack = [];

  save();
  render();
});

// Target
function changeTarget() {
  const answer = prompt("Enter your new target:", data.target);

  if (answer === null) return;

  const value = Number(answer);

  if (!Number.isSafeInteger(value) || value < 1 || value > 1000000000) {
    alert("Please enter a valid positive whole number.");
    return;
  }

  data.target = value;
  save();
  render();
}

// Modal
function showModal(title, content) {
  closeModal();

  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-heading">${title}</div>
      <div class="modal-content">${content}</div>
      <button class="modal-close">CLOSE</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".modal-close").onclick = closeModal;
}

function closeModal() {
  document.querySelector(".modal")?.remove();
}

// Settings
$("settings").addEventListener("click", () => {
  showModal("SETTINGS", `
    <label>Target
      <button id="change-target">CHANGE TARGET</button>
    </label>

    <label>Vibration
      <input type="checkbox" id="vibration" ${data.vibration ? "checked" : ""}>
    </label>

    <label>Sound
      <input type="checkbox" id="sound" ${data.sound ? "checked" : ""}>
    </label>

    <label>Number Animation
      <input type="checkbox" id="animation" ${data.animation ? "checked" : ""}>
    </label>

    <label>Theme
      <button id="change-theme">CHANGE THEME</button>
    </label>
  `);

  $("change-target").onclick = () => {
    closeModal();
    changeTarget();
  };

  $("vibration").onchange = event => {
    data.vibration = event.target.checked;
    save();
  };

  $("sound").onchange = event => {
    data.sound = event.target.checked;
    save();
  };

  $("animation").onchange = event => {
    data.animation = event.target.checked;
    save();
  };

  $("change-theme").onclick = () => {
    data.theme = data.theme === "dark" ? "light" : "dark";
    save();
    render();
    closeModal();
  };
});

// History
$("history").addEventListener("click", () => {
  const records = data.history.length
    ? data.history.map(item => `
        <div class="history-item">
          <strong>${Number(item.count).toLocaleString()} TAPS</strong>
          <small>${item.date}</small>
        </div>
      `).join("")
    : "<p>No counting history yet.</p>";

  showModal("COUNTING HISTORY", records);
});

// Initial display
render();
