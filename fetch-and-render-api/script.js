const apiUrl = 'https://jsonplaceholder.typicode.com/users';
const usersContainer = document.getElementById('users');
const statusMessage = document.getElementById('status');
const retryButton = document.getElementById('retry');

function createUserCard(user) {
    const card = document.createElement('article');
    const name = document.createElement('h2');
    const email = document.createElement('p');
    const city = document.createElement('p');

    card.className = 'user-card';
    name.textContent = user.name;
    email.textContent = user.email;
    city.textContent = user.address.city;
    card.append(name, email, city);

    return card;
}

async function loadUsers() {
    usersContainer.textContent = '';
    statusMessage.textContent = 'Loading users…';
    retryButton.hidden = true;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('Request failed');
        }

        const users = await response.json();
        const cards = users.map(createUserCard);

        usersContainer.append(...cards);
        statusMessage.textContent = cards.length === 0 ? 'No users found.' : '';
    } catch {
        statusMessage.textContent = 'Could not load users. Please try again.';
        retryButton.hidden = false;
    }
}

retryButton.addEventListener('click', loadUsers);
loadUsers();
