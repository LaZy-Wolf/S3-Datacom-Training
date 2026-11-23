const form = document.getElementById('todo-form');
const input = document.getElementById('task-input');
const list = document.getElementById('todo-list');

const tasks = JSON.parse(localStorage.getItem('todo-tasks') || '[]');

function saveTasks() {
    localStorage.setItem('todo-tasks', JSON.stringify(tasks));
}

function showTasks() {
    list.textContent = '';

    tasks.forEach(function(task, index) {
        const item = document.createElement('li');
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        const text = document.createElement('span');
        const deleteButton = document.createElement('button');

        checkbox.type = 'checkbox';
        checkbox.checked = task.done;
        text.textContent = task.text;
        deleteButton.textContent = 'Delete';
        deleteButton.type = 'button';
        deleteButton.setAttribute('aria-label', 'Delete ' + task.text);

        checkbox.addEventListener('change', function() {
            task.done = checkbox.checked;
            saveTasks();
        });

        deleteButton.addEventListener('click', function() {
            tasks.splice(index, 1);
            saveTasks();
            showTasks();
        });

        label.append(checkbox, text);
        item.append(label, deleteButton);
        list.append(item);
    });
}

form.addEventListener('submit', function(event) {
    event.preventDefault();

    const text = input.value.trim();
    if (text === '') {
        return;
    }

    tasks.push({ text: text, done: false });
    saveTasks();
    showTasks();
    input.value = '';
    input.focus();
});

showTasks();
