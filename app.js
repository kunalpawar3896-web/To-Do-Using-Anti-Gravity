// State management
let tasks = JSON.parse(localStorage.getItem('minimal-tasks')) || [];
tasks.forEach(t => {
    if (t.completed && !t.completedAt) {
        t.completedAt = t.createdAt || new Date().toISOString();
    }
});
let chartInstance = null;
let historyChartInstance = null;

// DOM Elements
const taskInput = document.getElementById('new-task-input');
const addTaskBtn = document.getElementById('addTask-btn');
const taskList = document.getElementById('task-list');
const completionPercentage = document.getElementById('completion-percentage');
const quoteText = document.getElementById('daily-quote');
const quoteAuthor = document.getElementById('quote-author');
const chartCanvas = document.getElementById('progressChart');
const historyChartCanvas = document.getElementById('historyChart');

// Motivational Quotes Data
const quotes = [
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It's not what we do once in a while that shapes our lives, but what we do consistently.", author: "Anthony Robbins" },
    { text: "Do less, but do it better.", author: "Essentialism" },
    { text: "Clutter is nothing more than postponed decisions.", author: "Barbara Hemphill" },
    { text: "The ability to simplify means to eliminate the unnecessary so that the necessary may speak.", author: "Hans Hofmann" },
];

function setDailyQuote() {
    // Basic day-based index to change quote daily deterministically
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const quoteIndex = dayOfYear % quotes.length;
    
    quoteText.textContent = `"${quotes[quoteIndex].text}"`;
    quoteAuthor.textContent = `- ${quotes[quoteIndex].author}`;
}

// Task Management Functions
function saveTasks() {
    localStorage.setItem('minimal-tasks', JSON.stringify(tasks));
    updateStats();
}

function createTaskElement(task, isNew = false) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''} ${isNew ? 'new-task' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Text content
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(deleteBtn);

    return li;
}

function renderTasks() {
    taskList.innerHTML = '';
    // Sort logic could go here (e.g., uncompleted first), but chronological is fine for simplicity
    tasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });
    lucide.createIcons();
    updateStats();
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    saveTasks();
    
    // Add to DOM with animation
    const taskEl = createTaskElement(newTask, true);
    taskList.appendChild(taskEl);
    lucide.createIcons();
    
    taskInput.value = '';
    taskInput.focus();
}

function toggleTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex > -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        if (tasks[taskIndex].completed) {
            tasks[taskIndex].completedAt = new Date().toISOString();
        } else {
            delete tasks[taskIndex].completedAt;
        }
        saveTasks();
        
        // Update DOM selectively
        const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskItem) {
            taskItem.classList.toggle('completed', tasks[taskIndex].completed);
            taskItem.querySelector('.task-checkbox').checked = tasks[taskIndex].completed;
        }
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    
    // Animate removal
    const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
    if (taskItem) {
        taskItem.style.opacity = '0';
        taskItem.style.transform = 'translateY(10px)';
        setTimeout(() => {
            taskItem.remove();
        }, 200);
    }
}

// Chart and Stats functionality
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    completionPercentage.textContent = `${percentage}%`;
    updateChart(percentage);
    updateHistoryChart();
}

function updateHistoryChart() {
    if (!historyChartCanvas) return;
    
    const dates = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const count = tasks.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(dateStr)).length;
        counts.push(count);
    }
    
    if (historyChartInstance) {
        historyChartInstance.destroy();
    }
    
    const ctx = historyChartCanvas.getContext('2d');
    
    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Completed Tasks',
                data: counts,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function updateChart(percentage) {
    if (chartInstance) {
        chartInstance.destroy(); // Recreate to handle resizing properly for this simple demo
    }

    // A minimal horizontal bullet chart representation
    const ctx = chartCanvas.getContext('2d');
    
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = "#8e8e8e";
    
    chartInstance = new Chart(ctx, {
        type: 'bar', // Using a horizontal bar chart
        data: {
            labels: ['Progress'],
            datasets: [{
                label: 'Completed',
                data: [percentage],
                backgroundColor: '#10b981',
                borderRadius: 20,
                borderSkipped: false,
                barThickness: 8,
            }, {
                label: 'Remaining',
                data: [100 - percentage],
                backgroundColor: '#eaeaea',
                borderRadius: 20,
                borderSkipped: false,
                barThickness: 8,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 0 },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: {
                    stacked: true,
                    min: 0,
                    max: 100,
                    display: false // Hide axis
                },
                y: {
                    stacked: true,
                    display: false // Hide axis
                }
            },
            animation: {
                duration: 500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize icons
    lucide.createIcons();
    
    // Set daily quote
    setDailyQuote();

    // Render initial tasks and chart
    renderTasks();
    
    // Add task events
    const addButton = document.getElementById('add-task-btn');
    if (addButton) {
        addButton.addEventListener('click', addTask);
    }

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
    });

    // Handle window resize for chart
    window.addEventListener('resize', () => {
        if(tasks.length >= 0) {
            updateStats();
        }
    });
});
