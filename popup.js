// DOM elements
const taskInput = document.querySelector('.text-input');
const taskList = document.querySelector('.task-list');
const completedList = document.querySelector('.completed-list');
const removeButton = document.querySelector('.remove');
const openPicker = document.querySelector('#open-picker');
const lists = document.querySelector('.lists');
const dateTimePicker = document.querySelector('#datetime-picker');

// Variables
let tasks = [];
let completedTasks = [];
let flag = 0;

// Load tasks from Chrome storage
const loadTasks = () => {
    chrome.storage.local.get(['tasks', 'completedTasks'], (result) => {
        tasks = result.tasks || [];
        completedTasks = result.completedTasks || [];
        displayTasks();
    });
};
loadTasks();

// Toggle visibility of date picker
openPicker.addEventListener('click', () => {
    dateTimePicker.style.visibility = flag ? 'hidden' : 'visible';
    lists.style.marginTop = flag ? '0' : '4rem';
    flag = !flag;
});

// Handle task input and add task with reminder
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const task = e.target.value;
        const reminderTime = dateTimePicker.value ? new Date(dateTimePicker.value).getTime() : null;

        if (task) {
            addTask({ text: task, reminderTime });
            e.target.value = '';
            dateTimePicker.value = ''; // Clear date-time input
            dateTimePicker.style.visibility = 'hidden';
            flag = 0;
            lists.style.marginTop = '0';
        }
    }
});

// Add task to list and save
const addTask = (task) => {
    tasks.push(task);
    saveTasks();
    displayTasks();
    chrome.runtime.sendMessage({ action: 'updateBadge' });

    // Set reminder if time is provided
    if (task.reminderTime) {
        chrome.alarms.create(task.text, { when: task.reminderTime });
        console.log(`Alarm set for task: ${task.text} at ${new Date(task.reminderTime)}`);  // Debug log
    }
};

// Save tasks and completed tasks to Chrome storage
const saveTasks = () => {
    chrome.storage.local.set({ tasks, completedTasks });
};

// Display tasks and completed tasks
const displayTasks = () => {
    taskList.innerHTML = '';
    completedList.innerHTML = '';

    if (tasks.length === 0 && completedTasks.length === 0) {
        const noTaskMessage = document.createElement('p');
        noTaskMessage.className = 'empty';
        noTaskMessage.textContent = 'No task yet 🙂';
        taskList.appendChild(noTaskMessage);
    } else {
        tasks.forEach((task, index) => {
            const taskItem = document.createElement('li');
            taskItem.className = 'tasks';

            taskItem.innerHTML = `
                <div class="task-left">
                    <input class="check-input" type="checkbox" data-index="${index}">
                    <p class="task">${task.text}</p>
                </div>
                <div class="task-right">
                    <span class="edit-button material-symbols-outlined" data-index="${index}">edit</span>
                    <span class="delete-button material-symbols-outlined" data-index="${index}">close</span>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    }

    completedTasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = 'tasks completed';

        taskItem.innerHTML = `
            <div class="task-left">
                <input class="check-input" type="checkbox" checked data-index="${index}">
                <p class="task">${task.text}</p>
            </div>
            <div class="task-right">
                <span class="delete-button material-symbols-outlined" data-index="${index}">close</span>
            </div>
        `;
        completedList.appendChild(taskItem);
    });

    removeButton.classList.toggle('hide', completedTasks.length === 0);

    document.querySelectorAll('.check-input').forEach(button => {
        button.addEventListener('change', handleCheckBox);
    });
    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', handleDeleteButton);
    });
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', handleEditButton);
    });
};

// Handle checkbox changes to move tasks between lists
const handleCheckBox = (e) => {
    const index = e.target.getAttribute('data-index');
    const isCompleted = e.target.checked;

    if (isCompleted) {
        completedTasks.push(tasks[index]);
        tasks.splice(index, 1);
    } else {
        tasks.push(completedTasks[index]);
        completedTasks.splice(index, 1);
    }
    saveTasks();
    displayTasks();
    chrome.runtime.sendMessage({ action: 'updateBadge' });
};

// Handle task deletion
const handleDeleteButton = (e) => {
    const index = e.target.getAttribute('data-index');
    const parentList = e.target.closest('ul');

    if (parentList === taskList) {
        tasks.splice(index, 1);
    } else {
        completedTasks.splice(index, 1);
    }
    saveTasks();
    displayTasks();
    chrome.runtime.sendMessage({ action: 'updateBadge' });
};

// Handle task editing
const handleEditButton = (e) => {
    const index = e.target.getAttribute('data-index');
    const taskItem = e.target.closest('li');
    const task = taskItem.querySelector('.task');

    task.innerHTML = `<input type="text" class="edit-input">`;
    const editInput = task.querySelector('.edit-input');
    editInput.value = tasks[index].text;
    editInput.focus();

    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTask = e.target.value;

            if (newTask) {
                tasks[index].text = newTask;
                saveTasks();
                displayTasks();
                chrome.runtime.sendMessage({ action: 'updateBadge' });
            }
        }
    });
};

// Remove all completed tasks
removeButton.addEventListener('click', () => {
    completedTasks = [];
    saveTasks();
    displayTasks();
});

// Initial display of tasks
displayTasks();
