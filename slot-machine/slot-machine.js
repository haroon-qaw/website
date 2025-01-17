document.addEventListener('DOMContentLoaded', () => {
  
  //variables 
  const button = document.getElementById('3d-1-suite');
  const container = document.getElementById('slot-container');
  const totalTimeDiv = document.getElementById('totalTime');
  const totalCostDiv = document.getElementById('totalCost');
  const maintData = Array.from({ length: 177 }, () => 0); // Array to track frequencies (10-186)
  const bugData = Array.from({ length: 91 }, () => 0); // Array to track frequencies (30-120)

  //chart js declarations
  let maintChart; // Declare the maintenance chart variable
  let bugChart; // Declare the bug chart variable

  // Add sounds
  const resolvingSound = new Audio('https://cdn.freesound.org/previews/118/118239_1430216-lq.mp3');
  const completionSound = new Audio('https://cdn.freesound.org/previews/56/56268_91374-lq.mp3');
  resolvingSound.volume = 0.5; // Reduce volume to 50%
  completionSound.volume = 0.5; // Reduce volume to 50%


   // Counter for resolved slots
  let resolvedCount = 0;

  // Slot states with probabilities and ranges
  const slotStates = [
    { state: 'slot-test-bug', weight: 0.5, range: [30, 120], average: 50 },
    { state: 'slot-test-maint', weight: 17, range: [10, 186], average: 95 },
    { state: 'slot-test-pass', weight: 82.5, range: [1, 5], average: 3 }
  ];

  // Calculate cumulative weights for weighted selection
  const cumulativeWeights = [];
  let totalWeight = 0;
  for (const state of slotStates) {
    totalWeight += state.weight;
    cumulativeWeights.push(totalWeight);
  }

  // Function to generate a random number with a bell curve
  function getBellCurveRandom(min, max, average) {
    let sum = 0;
    for (let i = 0; i < 6; i++) {
      sum += Math.random();
    }
    const normalized = sum / 6; // Normalize the sum to [0, 1]
    const rangeMidpoint = (min + max) / 2;
    const shift = average - rangeMidpoint;
    return Math.round(min + (max - min) * normalized + shift);
  }

  // Function to select a slot state based on weighted probabilities
  function getWeightedRandomState() {
    const random = Math.random() * totalWeight;
    for (let i = 0; i < cumulativeWeights.length; i++) {
      if (random <= cumulativeWeights[i]) {
        return slotStates[i];
      }
    }
  }

  // Function to start cycling states for a slot
  function startCycling(slot) {
    let currentIndex = 0;
    const cyclingStates = slotStates.map(state => state.state);

    // Cycle states every 100ms
    const interval = setInterval(() => {
      slot.className = `slot-test ${cyclingStates[currentIndex]}`;
      currentIndex = (currentIndex + 1) % cyclingStates.length; // Cycle to next state
    }, 100);

    // Stop cycling at a random time between 1 and 3 seconds
    const stopTime = Math.random() * 2000 + 1000; // Random time in milliseconds
    setTimeout(() => {
      clearInterval(interval);
      const finalState = getWeightedRandomState();

      // Apply the final state to the slot
      slot.className = `slot-test ${finalState.state}`;

      // Log data for the respective chart
      if (finalState.state === 'slot-test-maint') {
        const randomNumber = getBellCurveRandom(
          finalState.range[0],
          finalState.range[1],
          finalState.average
        );
        maintData[randomNumber - 10]++; // Increment frequency for this number once
        updateMaintChart(); // Update maintenance chart immediately
      } else if (finalState.state === 'slot-test-bug') {
        const randomNumber = getBellCurveRandom(
          finalState.range[0],
          finalState.range[1],
          finalState.average
        );
        bugData[randomNumber - 30]++; // Increment frequency for this number once
        updateBugChart(); // Update bug chart immediately
      }

      updateTotals();

      // Increment resolved counter and check if all slots are resolved
      resolvedCount++;
      console.log(resolvedCount); // Add this line
      if (resolvedCount === 250) {
      	removeHighlightNumber();
        resolvingSound.pause();
        resolvingSound.currentTime = 0;
        completionSound.play();
      }
    }, stopTime);
  }

function highlightNumber() {
  const totalElements = document.querySelectorAll('.slot-result-num');
  totalElements.forEach((element) => {
    if (resolvedCount === 1) {
      element.classList.add('highlight'); // Add the highlight class when spinning starts
    }
  });
}

function removeHighlightNumber() {
  const totalElements = document.querySelectorAll('.slot-result-num');
  totalElements.forEach((element) => {
    if (resolvedCount === 250) {
      element.classList.remove('highlight'); // Add the highlight class when spinning starts
    }
  });
}

// Add event listner to the run once button
button.addEventListener('click', () => {
  // Clear existing content in the container
  container.innerHTML = '';
  resolvedCount = 0; // Reset resolved counter

  // Start resolving sound
  resolvingSound.loop = true;
  resolvingSound.play();

  // Generate 250 divs with the class 'slot-test'
  for (let i = 0; i < 250; i++) {
    const div = document.createElement('div');
    div.className = 'slot-test';
    container.appendChild(div);

    // Start cycling states for each slot
    startCycling(div);
  }
});

// Function to update the total time and cost
function updateTotals() {
    const totalMaintTime = maintData.reduce((sum, value, index) => sum + value * (index + 10), 0);
    const totalBugTime = bugData.reduce((sum, value, index) => sum + value * (index + 30), 0);
    const totalTime = (totalMaintTime + totalBugTime) / 60;
    const totalCost = totalTime * 65; // Convert to hours and multiply by rate

    totalTimeDiv.textContent = `${totalTime.toFixed(2)} hours`;
    totalCostDiv.textContent = `$${totalCost.toFixed(2)}`;

    highlightNumber();


  }

// Function to initialize the maintenance chart
function initializeMaintChart() {
  const ctx = document.getElementById('maint-chart').getContext('2d');
  maintChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: 177 }, (_, i) => i + 10), // X-axis: 10 to 186
      datasets: [
        {
          label: 'Number of Tests (Maintenance)',
          data: [...maintData],
          borderColor: '#3b3bef',
          backgroundColor: 'rgba(59, 59, 239, 0.2)',
          borderWidth: 1,
          pointBackgroundColor: '#3b3bef',
          pointBorderColor: '#3b3bef',
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              const numTests = tooltipItem.raw;
              const numMin = tooltipItem.label;
              return `${numTests} needed ${numMin} to maintain`;
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Maintenance Time (10-186)' },
          min: 10,
          max: 186,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#0df2cc',
          },
        },
        y: {
          title: { display: true, text: 'Number of Tests' },
          beginAtZero: true,
          suggestedMax: 25,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#0df2cc',
          },
        },
      },
    },
  });
}


  // Function to initialize the bug chart
function initializeBugChart() {
  const ctx = document.getElementById('bug-chart').getContext('2d');
  bugChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: 91 }, (_, i) => i + 30), // X-axis: 30 to 120
      datasets: [
        {
          label: 'Number of Tests (Bugs)',
          data: [...bugData],
          borderColor: '#f4bdec',
          backgroundColor: 'rgba(244, 189, 236, 0.2)',
          borderWidth: 1,
          pointBackgroundColor: '#f4bdec',
          pointBorderColor: '#f4bdec',
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allows the chart to resize freely
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              const numTests = tooltipItem.raw;
              const numMin = tooltipItem.label;
              return `${numTests} needed ${numMin} to fix`;
            }
          }
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Bug Time (30-120)' },
          min: 30,
          max: 120,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#0df2cc',
          },
        },
        y: {
          title: { display: true, text: 'Number of Tests' },
          beginAtZero: true,
          suggestedMax: 10,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#0df2cc',
          },
        },
      },
    },
  });
}


// Function to update the maintenance chart
function updateMaintChart() {
  // Directly set the dataset to match the current maintData
  maintChart.data.datasets[0].data = [...maintData];
  maintChart.update();
}


// Function to update the bug chart
function updateBugChart() {
  // Directly set the dataset to match the current bugData
  bugChart.data.datasets[0].data = [...bugData];
  bugChart.update();
}


// Initialize charts on page load
initializeMaintChart();
initializeBugChart();
});

//test