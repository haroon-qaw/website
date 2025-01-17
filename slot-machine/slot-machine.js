document.addEventListener('DOMContentLoaded', () => {
  
  //variables 
  const buttonRunOnce = document.getElementById('3d-1-suite');
  const buttonRunMonth = document.getElementById('3d-run-month');
  const container = document.getElementById('slot-container');
  const totalTimeDiv = document.getElementById('totalTime');
  const totalCostDiv = document.getElementById('totalCost');
  const maintData = Array.from({ length: 177 }, () => 0); // Array to track frequencies (10-186)
  const bugData = Array.from({ length: 91 }, () => 0); // Array to track frequencies (30-120)

  //chart js declarations
  let maintChart; // Declare the maintenance chart variable
  let bugChart; // Declare the bug chart variable

  //Sounds
  //slots spinning
  const resolvingSound = new Audio('https://cdn.freesound.org/previews/118/118239_1430216-lq.mp3');
  resolvingSound.volume = 0.5; // Reduce volume to 50%
  
  //stop spinning
  const completionSound = new Audio('https://cdn.freesound.org/previews/56/56268_91374-lq.mp3');
  completionSound.volume = 0.5; // Reduce volume to 50%


   // Counter for resolved slots
  let resolvedCount = 0;

  // Centralized slot configuration
  const slotConfig = {
    bug: { name: 'slot-test-bug', weight: 0.5, range: [15, 45], average: 30 },
    maintenance: { name: 'slot-test-maint', weight: 17, range: [10, 100], average: 45 },
    pass: { name: 'slot-test-pass', weight: 82.5, range: [1, 5], average: 3 },
  };

  function handleSlotResult(slotState, randomValue) {
    if (slotState.range) {
      const offset = slotState.range[0];
      slotData[slotState.name][randomValue - offset]++; // Increment the appropriate index
    }
  }
  

  // Automatically initialize slotData arrays based on slotConfig ranges
  const slotData = {};
  Object.values(slotConfig).forEach(slot => {
    if (slot.range) {
      const arraySize = slot.range[1] - slot.range[0] + 1;
      slotData[slot.name] = Array.from({ length: arraySize }, () => 0);
    }
  });

  // Calculate cumulative weights for weighted selection
  const cumulativeWeights = [];
  let totalWeight = 0;
  Object.values(slotConfig).forEach(slot => {
    totalWeight += slot.weight;
    cumulativeWeights.push({ name: slot.name, cumulativeWeight: totalWeight });
  });

// Function to get weighted random slot state
function getWeightedRandomState() {
  const random = Math.random() * totalWeight;
  for (const slot of cumulativeWeights) {
    if (random <= slot.cumulativeWeight) {
      return Object.values(slotConfig).find(config => config.name === slot.name);
    }
  }
}

// Function to generate random number based on range and average
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

  // Function to start cycling states for a slot
  function startCycling(slot) {
    let currentIndex = 0;
    const cyclingStates = Object.values(slotConfig).map(config => config.name);

    // Cycle states every 100ms
    const interval = setInterval(() => {
      slot.className = `slot-test ${cyclingStates[currentIndex]}`;
      currentIndex = (currentIndex + 1) % cyclingStates.length; // Cycle to the next state
    }, 100);

    // Stop cycling at a random time between 1 and 3 seconds
    const stopTime = Math.random() * 2000 + 1000; // Random time in milliseconds
    setTimeout(() => {
      clearInterval(interval);
      const finalState = getWeightedRandomState();
      const randomValue = getBellCurveRandom(
        finalState.range[0],
        finalState.range[1],
        finalState.average
      );

      // Apply the final state to the slot
      slot.className = `slot-test ${finalState.name}`;

      // Log data for the respective chart
      handleSlotResult(finalState, randomValue);

      // Update charts and totals
      updateMaintChart();
      updateBugChart();
      updateTotals();

      // Increment resolved counter and check if all slots are resolved
      resolvedCount++;
      console.log(resolvedCount);
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

// Event listeners for buttons
buttonRunOnce.addEventListener('click', () => {
  container.innerHTML = '';
  resolvedCount = 0;

  resolvingSound.loop = true;
  resolvingSound.play();

  for (let i = 0; i < 250; i++) {
    const div = document.createElement('div');
    div.className = 'slot-test';
    container.appendChild(div);

    startCycling(div);
  }
});

// Function for the run-month button
buttonRunMonth.addEventListener('click', () => {
  const spins = 20; // Simulate one month of spins

  // Simulate spins for maintenance and bug data
  for (let day = 0; day < spins; day++) {
    for (let i = 0; i < 250; i++) {
      const finalState = getWeightedRandomState();
      const randomValue = getBellCurveRandom(finalState.range[0], finalState.range[1], finalState.average);
      if (finalState.range) {
        const offset = finalState.range[0];
        slotData[finalState.name][randomValue - offset]++;
      }
    }
  }

  // Update charts and totals cumulatively
  updateMaintChart();
  updateBugChart();
  updateTotals();
});





// Function to update the total time and cost
function updateTotals() {
    const totalMaintTime = slotData[slotConfig.maintenance.name].reduce((sum, value, index) => sum + value * (index + slotConfig.maintenance.range[0]), 0);
    const totalBugTime = slotData[slotConfig.bug.name].reduce((sum, value, index) => sum + value * (index + slotConfig.bug.range[0]), 0);  
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
      labels: Array.from({ length: slotConfig.maintenance.range[1] - slotConfig.maintenance.range[0] + 1 }, (_, i) => i + slotConfig.maintenance.range[0]),
      datasets: [
        {
          label: 'Maintenance',
          data: [...slotData[slotConfig.maintenance.name]],
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
          title: { display: true, text: 'Time(min)' },
          min: slotConfig.maintenance.range[0],
          max: slotConfig.maintenance.range[1],
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
      labels: Array.from({ length: slotConfig.bug.range[1] - slotConfig.bug.range[0] + 1 }, (_, i) => i + slotConfig.bug.range[0]),
      datasets: [
        {
          label: 'Bugs',
          data: [...slotData[slotConfig.bug.name]],
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
          title: { display: true, text: 'Time(min)' },
          min: slotConfig.bug.range[0],
          max: slotConfig.bug.range[1],
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
  maintChart.data.datasets[0].data = [...slotData['slot-test-maint']];
  maintChart.update();
}

function updateBugChart() {
  bugChart.data.datasets[0].data = [...slotData['slot-test-bug']];
  bugChart.update();
}


// Initialize charts on page load
initializeMaintChart();
initializeBugChart();
});

//test line 01