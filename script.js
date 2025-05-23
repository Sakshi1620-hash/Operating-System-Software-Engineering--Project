let memory = [];
let pageTable = [];
let history = [];
let hits = 0;
let faults = 0;
let frameSize = 1;
let numFrames = 3;
let accessHistory = [];
let fifoPointer = 0;
let chart;
let pageSequence = [];
let currentStep = -1;

function setAlgorithm(algo) {
  window.currentAlgorithm = algo;
}

function initialize() {
  const frameSizeInput = document.getElementById("frameSize");
  const numFramesInput = document.getElementById("numFrames");

  frameSize = parseInt(frameSizeInput.value);
  numFrames = parseInt(numFramesInput.value);
  memory = new Array(numFrames).fill(null);
  pageTable = [];
  hits = 0;
  faults = 0;
  fifoPointer = 0;
  history = [];
  accessHistory = [];
  updateView();
  log("Memory initialized.");
  updateChart();
}

function log(message, isReplacement = false) {
  const logDiv = document.getElementById("log");
  const entry = document.createElement("div");
  entry.textContent = message;
  logDiv.appendChild(entry);
  logDiv.scrollTop = logDiv.scrollHeight;
  history.push(message);

  if (isReplacement) {
    const arrow = document.createElement("div");
    arrow.className = "replacement-arrow";
    arrow.textContent = "↺ Page Replaced";
    logDiv.appendChild(arrow);
    setTimeout(() => arrow.remove(), 1500);
  }
}

function updateView(highlight = null, page = null) {
  const framesView = document.getElementById("framesView");
  const statsDiv = document.getElementById("stats");
  framesView.innerHTML = "";

  memory.forEach((p, index) => {
    const div = document.createElement("div");
    div.className = "frame";

    if (p !== null) {
      div.textContent = "Page " + p;
    } else {
      div.textContent = "[Empty]";
    }

    if (highlight && p === page) {
      div.classList.add(highlight); // 'hit' or 'fault'
      setTimeout(() => div.classList.remove(highlight), 1000);
    }

    framesView.appendChild(div);
  });

  const total = hits + faults;
  const hitRatio = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
  const faultRatio = total > 0 ? ((faults / total) * 100).toFixed(2) : 0;
  statsDiv.innerHTML = `Hits: ${hits}, Faults: ${faults}, Hit Ratio: ${hitRatio}%, Fault Ratio: ${faultRatio}%`;

  updateChart();
}

function playSound(type) {
  const sound = document.getElementById(type + "Sound");
  if (sound) sound.play();
}

function loadPage(page = null) {
  const pageInput = document.getElementById("pageInput");
  if (page === null) {
    page = parseInt(pageInput.value);
  }
  if (isNaN(page)) {
    alert("Please enter a valid page number.");
    return;
  }

  const algo = window.currentAlgorithm || "LRU";

  if (memory.includes(page)) {
    hits++;
    log(`Page ${page} hit.`);
    playSound("hit");

    if (algo === "LRU") {
      const index = accessHistory.indexOf(page);
      if (index !== -1) accessHistory.splice(index, 1);
      accessHistory.push(page);
    }

    updateView("hit", page);
  } else {
    faults++;
    playSound("fault");

    if (memory.includes(null)) {
      const emptyIndex = memory.indexOf(null);
      memory[emptyIndex] = page;
      if (algo === "LRU") accessHistory.push(page);
      log(`Page ${page} loaded into empty frame.`);
    } else {
      if (algo === "FIFO") {
        const removed = memory[fifoPointer];
        memory[fifoPointer] = page;
        fifoPointer = (fifoPointer + 1) % numFrames;
        log(`Page ${removed} replaced with ${page} using FIFO.`, true);
      } else if (algo === "LRU") {
        const lruPage = accessHistory.shift();
        const lruIndex = memory.indexOf(lruPage);
        memory[lruIndex] = page;
        accessHistory.push(page);
        log(`Page ${lruPage} replaced with ${page} using LRU.`, true);
      }
    }
    updateView("fault", page);
  }
  updateView();
}

function resetMemory() {
  const segmentLog = document.getElementById("segmentLog");
  initialize();
  segmentLog.innerHTML = "";
  log("Memory reset.");
}

function loadSequence() {
  const sequenceInput = document.getElementById("sequenceInput");
  const sequence = sequenceInput.value.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
  for (let page of sequence) {
    loadPage(page);
  }
}

function loadSegment() {
  const segmentLog = document.getElementById("segmentLog");
  const segmentNum = document.getElementById("segmentNum");
  const offsetVal = document.getElementById("offsetVal");

  const segment = parseInt(segmentNum.value);
  const offset = parseInt(offsetVal.value);
  if (isNaN(segment) || isNaN(offset)) return;

  const logLine = `Accessed Segment ${segment}, Offset ${offset}`;
  const entry = document.createElement("div");
  entry.textContent = logLine;
  segmentLog.appendChild(entry);
  segmentLog.scrollTop = segmentLog.scrollHeight;
}

function downloadLog() {
  const blob = new Blob([history.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "memory_log.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function updateChart() {
  const chartCanvas = document.getElementById("chartCanvas");
  const total = hits + faults;
  const data = {
    labels: ["Hit Ratio", "Fault Ratio"],
    datasets: [{
      label: "Page Statistics",
      data: total > 0 ? [(hits / total) * 100, (faults / total) * 100] : [0, 0],
      backgroundColor: ["#2ecc71", "#e74c3c"],
    }],
  };

  if (chart) {
    chart.data = data;
    chart.update();
  } else {
    chart = new Chart(chartCanvas, {
      type: "bar",
      data: data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  }
}

function prepareSequence() {
  const sequenceInput = document.getElementById("sequenceInput");
  pageSequence = sequenceInput.value.split(",").map(x => parseInt(x.trim())).filter(x => !isNaN(x));
  currentStep = -1;
  updateStepIndicator();
  resetMemory();
  log("Sequence loaded. Use 'Next' to step through.");
}

function nextStep() {
  if (currentStep + 1 < pageSequence.length) {
    currentStep++;
    loadPage(pageSequence[currentStep]);
    updateStepIndicator();
  } else {
    log("End of sequence reached.");
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    resetMemory();
    for (let i = 0; i <= currentStep; i++) {
      loadPage(pageSequence[i]);
    }
    updateStepIndicator();
  } else {
    log("At beginning of sequence.");
  }
}

function updateStepIndicator() {
  const stepIndicator = document.getElementById("stepIndicator");
  if (pageSequence.length === 0) {
    stepIndicator.textContent = "";
  } else {
    stepIndicator.textContent = `Step ${currentStep + 1} of ${pageSequence.length}`;
  }
}

window.onload = () => {
  setAlgorithm("LRU");
  initialize();
};
