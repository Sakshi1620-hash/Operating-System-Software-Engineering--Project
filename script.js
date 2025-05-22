// Memory Management Simulation with FIFO and LRU Algorithms);

// Variables for memory and algorithm state
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

// Initialize memory and reset stats
function initialize() {
  const frameSizeInput = document.getElementById('frameSize');
  const numFramesInput = document.getElementById('numFrames');

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
  log('Memory initialized.');
  updateChart();
}

// Log messages in log section
function log(message) {
  const logDiv = document.getElementById('log');

  const entry = document.createElement('div');
  entry.textContent = message;
  logDiv.appendChild(entry);
  logDiv.scrollTop = logDiv.scrollHeight;
  history.push(message);
}

// Render memory frames and stats
function updateView() {
  const framesView = document.getElementById('framesView');
  const statsDiv = document.getElementById('stats');
  framesView.innerHTML = '';
  memory.forEach((page, index) => {
    const div = document.createElement('div');
    div.className = 'frame';
    if (page !== null) {
      div.textContent = 'Page ' + page;
    } else {
      div.textContent = '[Empty]';
    }
    framesView.appendChild(div);
  });
  const total = hits + faults;
  const hitRatio = total > 0 ? (hits / total * 100).toFixed(2) : 0;
  const faultRatio = total > 0 ? (faults / total * 100).toFixed(2) : 0;
  statsDiv.innerHTML = `Hits: ${hits}, Faults: ${faults}, Hit Ratio: ${hitRatio}%, Fault Ratio: ${faultRatio}%`;
  updateChart();
}

// Apply selected page replacement algorithm
function loadPage() {
  const pageInput = document.getElementById('pageInput');
  const algoSelect = document.getElementById('algo');

  const page = parseInt(pageInput.value);
  const algo = algoSelect.value;
  if (isNaN(page)) return;
  if (memory.includes(page)) {
    hits++;
    log(`Page ${page} hit.`);
    if (algo === 'LRU') {
      const index = accessHistory.indexOf(page);
      if (index !== -1) accessHistory.splice(index, 1);
      accessHistory.push(page);
    }
  } else {
    faults++;
    if (memory.includes(null)) {
      const emptyIndex = memory.indexOf(null);
      memory[emptyIndex] = page;
      if (algo === 'LRU') accessHistory.push(page);
      log(`Page ${page} loaded into empty frame.`);
    } else {
      if (algo === 'FIFO') {
        const removed = memory[fifoPointer];
        memory[fifoPointer] = page;
        fifoPointer = (fifoPointer + 1) % numFrames;
        log(`Page ${removed} replaced with ${page} using FIFO.`);
      } else if (algo === 'LRU') {
        const lruPage = accessHistory.shift();
        const lruIndex = memory.indexOf(lruPage);
        memory[lruIndex] = page;
        accessHistory.push(page);
        log(`Page ${lruPage} replaced with ${page} using LRU.`);
      }
    }
  }
  updateView();
}

// Reset simulation
function resetMemory() {
  const segmentLog = document.getElementById('segmentLog');
  initialize();
  segmentLog.innerHTML = '';
  log('Memory reset.');
}

// Load page reference string from comma-separated input
function loadSequence() {
  const sequenceInput = document.getElementById('sequenceInput');

  const sequence = sequenceInput.value.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
  for (let page of sequence) {
    pageInput.value = page;
    loadPage();
  }
}

// Simulate segmented memory access
function loadSegment() {
  const segmentLog = document.getElementById('segmentLog');
  const segmentNum = document.getElementById('segmentNum');
  const offsetVal = document.getElementById('offsetVal');

  const segment = parseInt(segmentNum.value);
  const offset = parseInt(offsetVal.value);
  if (isNaN(segment) || isNaN(offset)) return;
  const logLine = `Accessed Segment ${segment}, Offset ${offset}`;
  const entry = document.createElement('div');
  entry.textContent = logLine;
  segmentLog.appendChild(entry);
  segmentLog.scrollTop = segmentLog.scrollHeight;
}

// Download the session log as a .txt file
function downloadLog() {
  const blob = new Blob([history.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'memory_log.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// Update or render the chart for hit/fault ratio
function updateChart() {
  const chartCanvas = document.getElementById('chartCanvas');
  const total = hits + faults;
  const data = {
    labels: ['Hit Ratio', 'Fault Ratio'],
    datasets: [{
      label: 'Page Statistics',
      data: total > 0 ? [hits / total * 100, faults / total * 100] : [0, 0],
      backgroundColor: ['#2ecc71', '#e74c3c'],
    }]
  };

  if (chart) {
    chart.data = data;
    chart.update();
  } else {
    chart = new Chart(chartCanvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }
}

// Initialize chart and memory on first load
initialize();
