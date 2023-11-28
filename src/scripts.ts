interface Item {
    id: number;
    title: string;
    description: string;
    author: string;
    imgLink: string;
    dateAdded: string;
}

let apiUrl = 'http://localhost:3005/items';

function formatDaysAgo(isoDateString: string): string {
    const currentDate = new Date();
    const providedDate = new Date(Date.parse(isoDateString));

    if (isNaN(providedDate.getTime())) {
        return 'Invalid Date';
    }

    const timeDifference = currentDate.getTime() - providedDate.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    if (daysDifference === 0) {
        return 'today';
    } else if (daysDifference === 1) {
        return 'yesterday';
    } else {
        return `${daysDifference} days ago`;
    }
}

function renderItems(items: Item[]) {
    const ulElement = document.getElementById('js-list');
    if (ulElement) {
        ulElement.innerHTML = '';

        items.forEach(item => {
            const liElement = document.createElement('li');
            const itemId = item.id;

            liElement.innerHTML = `
                <h2>
                    ${item.title}
                </h2>
                <img class="card-img" src="${item.imgLink}" alt="">
                <p>
                    ${item.description}
	            </p>
                <p class="card-bottom">
                    Posted by <strong style="font-weight: bold;">${item.author}</strong>, ${formatDaysAgo(item.dateAdded)}
	            </p>
                <div class="buttons">
                    <button class="button yellow" data-id="${itemId}">
                     Edit
                    </button>
                    <button class="button red" data-id="${itemId}">
                        Delete
                    </button>
                </div>`;

            ulElement.appendChild(liElement);

            const deleteButton = liElement.querySelector('.button.red');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    const itemId = parseInt(deleteButton.getAttribute('data-id') || '0', 10);
                    removeItem(itemId);
                });
            }

            const editButton = liElement.querySelector('.button.yellow');
            if (editButton) {
                editButton.addEventListener('click', () => {
                    const itemId = parseInt(editButton.getAttribute('data-id') || '0', 10);
                    editItem(itemId);
                });
            }
        });
    }
}

async function fetchData(): Promise<void> {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        renderItems(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function fetchItemById(id: number) {
    const response = await fetch(`${apiUrl}/${id}`);
    const item = await response.json();
    return item;
}

async function updateItem(id: number, imgLink: string, author: string, title: string, description: string, dateAdded: string) {
    const response = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, imgLink, author, title, description, dateAdded }),
    });

    const updatedItem = await response.json();
    return updatedItem;
}

function editItem(id: number) {
    const editModal = document.getElementById('editModal');
    const overlay = document.getElementById('overlay');
    const editTitleInput = document.getElementById('editTitle') as HTMLInputElement;
    const editDescriptionInput = document.getElementById('editDescription') as HTMLInputElement;
    const editAuthorInput = document.getElementById('editAuthor') as HTMLInputElement;
    const editImgInput = document.getElementById('editImg') as HTMLInputElement;

    if (editModal && overlay && editTitleInput && editDescriptionInput && editAuthorInput && editImgInput) {
        (async () => {
            try {
                const existingItem = await fetchItemById(id);
                editTitleInput.value = existingItem.title;
                editDescriptionInput.value = existingItem.description;
                editAuthorInput.value = existingItem.author;
                editImgInput.value = existingItem.imgLink;

                editModal.dataset.itemId = id.toString();

                editModal.style.display = 'block';
                overlay.style.display = 'block';

                document.getElementById('saveEdit')?.addEventListener('click', async () => {
                    try {
                        const itemId = parseInt(editModal.dataset.itemId || '0', 10);

                        const editedTitle = editTitleInput.value;
                        const editedImgLink = editImgInput.value;
                        const editedAuthor = editAuthorInput.value;
                        const editedDescription = editDescriptionInput.value;

                        await updateItem(itemId, editedImgLink, editedAuthor, editedTitle, editedDescription, existingItem.dateAdded);

                        editModal.style.display = 'none';
                        overlay.style.display = 'none';
                        fetchData();
                    } catch (error) {
                        console.error('Error editing item:', error);
                    }
                });

                document.getElementById('cancelEdit')?.addEventListener('click', () => {
                    editModal.style.display = 'none';
                    overlay.style.display = 'none';
                });
            } catch (error) {
                console.error('Error fetching item:', error);
            }
        })();
    } else {
        console.error('One or more modal elements not found.');
    }
}

async function addItem(imgLink: string, author: string, title: string, description: string): Promise<Item | undefined> {
    try {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString();

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imgLink, author, title, description, dateAdded: formattedDate }),
        });

        const newItem = await response.json();
        fetchData();
        return newItem;
    } catch (error) {
        console.error('Error adding item:', error);
    }
}

async function removeItem(id: number): Promise<void> {
    try {
        await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE',
        });

        fetchData();
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    document.getElementById('addEntry')?.addEventListener('click', () => {
        const titleInput = document.getElementById('title') as HTMLInputElement;
        const descriptionInput = document.getElementById('description') as HTMLInputElement;
        const authorInput = document.getElementById('author') as HTMLInputElement;
        const imgInput = document.getElementById('imgLink') as HTMLInputElement;
    
        const imgLink = imgInput.value;
        const author = authorInput.value;
        const title = titleInput.value;
        const description = descriptionInput.value;
    
        addItem(imgLink, author, title, description);
        imgInput.value = '';
        authorInput.value = '';
        titleInput.value = '';
        descriptionInput.value = ''
    });
});