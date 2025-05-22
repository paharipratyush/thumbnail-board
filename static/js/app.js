// DOM Elements
const boardList = document.getElementById('board-list');
const activeBoardTitle = document.getElementById('active-board-title');
const thumbnailGrid = document.getElementById('thumbnail-grid');
const thumbnailForm = document.getElementById('thumbnail-form');
const thumbnailUrlInput = document.getElementById('thumbnail-url');
const addBoardBtn = document.getElementById('add-board-btn');
const addBoardModal = document.getElementById('add-board-modal');
const boardNameInput = document.getElementById('board-name');
const createBoardBtn = document.getElementById('create-board-btn');
const shareBoardBtn = document.getElementById('share-board-btn');
const shareBoardModal = document.getElementById('share-board-modal');
const shareLinkInput = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const toast = document.getElementById('toast');
const closeModalButtons = document.querySelectorAll('.close-modal');
const editBoardModal = document.getElementById('edit-board-modal');
const editBoardNameInput = document.getElementById('edit-board-name');
const editBoardIdInput = document.getElementById('edit-board-id');
const updateBoardBtn = document.getElementById('update-board-btn');
const deleteBoardBtn = document.getElementById('delete-board-btn');

let activeBoard = null;
let isSharedView = false; // New flag to track shared view

// Initialize the app
document.addEventListener('DOMContentLoaded', init);

async function init() {
    const pathSegments = window.location.pathname.split('/');
    // Check if the URL is like /board/some-id
    if (pathSegments.length === 3 && pathSegments[1] === 'board' && pathSegments[2]) {
        const initialBoardId = pathSegments[2];
        isSharedView = true;
        document.body.classList.add('shared-view'); // Add class for CSS styling
        await fetchAndRenderThumbnails(initialBoardId); // Directly fetch the shared board's thumbnails
        // No need to fetch all boards or setup board switching in shared view
    } else {
        // Normal view: Fetch all boards and select the first/default one
        await fetchBoards();
    }
    setupEventListeners();
    applySharedViewRestrictions(); // Apply UI restrictions based on view type
}

// Fetch all boards from the backend (only called in normal view)
async function fetchBoards() {
    try {
        const response = await fetch('/api/boards');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const boardsData = await response.json();

        if (boardsData.length === 0) {
            // If no boards exist, create a default one
            await createNewBoard('My First Board', true);
            return; // Exit as createNewBoard will re-render boards
        }

        // Set the first board as active by default if not already active
        if (!activeBoard) {
            activeBoard = boardsData[0];
            await fetchAndRenderThumbnails(activeBoard.id);
        } else {
            // If activeBoard is set (e.g., after updating its name), ensure its thumbnails are rendered
            // Re-fetch to update content if needed, but primarily render sidebar
            await fetchAndRenderThumbnails(activeBoard.id);
        }

        renderBoards(boardsData); // Render sidebar for normal view
    } catch (error) {
        console.error('Error fetching boards:', error);
        showToast('Failed to load boards. Please try again.', false);
    }
}

// Fetch thumbnails for a specific board from the backend and render them
async function fetchAndRenderThumbnails(boardId) {
    if (!boardId) {
        thumbnailGrid.innerHTML = `
            <div class="empty-state">
                <p>No board selected.</p>
                ${!isSharedView ? '<p class="small-text">Select or create a board to get started.</p>' : ''}
            </div>
        `;
        activeBoardTitle.textContent = 'No Board Selected';
        return;
    }

    try {
        const response = await fetch(`/api/boards/${boardId}`);
        if (!response.ok) {
            if (response.status === 404) {
                showToast('Board not found. It might have been deleted.', false);
                // If in shared view and board not found, just clear content
                if (isSharedView) {
                    activeBoardTitle.textContent = 'Board Not Found';
                    thumbnailGrid.innerHTML = `
                        <div class="empty-state">
                            <p>This board could not be found or has been deleted.</p>
                        </div>
                    `;
                    return;
                }
                // If in normal view and board not found, go back to home
                history.pushState(null, '', '/');
                await fetchBoards(); // Re-fetch to update the sidebar
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        activeBoard = await response.json();
        renderThumbnails();
    } catch (error) {
        console.error('Error fetching board thumbnails:', error);
        showToast('Failed to load thumbnails. Please try again.', false);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Only add listeners for interactive elements if not in shared view
    if (!isSharedView) {
        thumbnailForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addThumbnail();
        });
        addBoardBtn.addEventListener('click', () => {
            boardNameInput.value = '';
            addBoardModal.classList.add('active');
            boardNameInput.focus();
        });
        createBoardBtn.addEventListener('click', () => createNewBoard(boardNameInput.value.trim()));
        shareBoardBtn.addEventListener('click', () => {
            if (!activeBoard) {
                showToast('No board selected to share.', false);
                return;
            }
            shareBoardModal.classList.add('active');
            const shareLink = getBoardShareLink(activeBoard.id);
            shareLinkInput.value = shareLink;
        });
        copyLinkBtn.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy');
            showToast('Link copied to clipboard!');
        });
        updateBoardBtn.addEventListener('click', updateBoardName);
        deleteBoardBtn.addEventListener('click', deleteBoard);
        boardNameInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                createNewBoard(boardNameInput.value.trim());
            }
        });
        editBoardNameInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                updateBoardName();
            }
        });
    }

    // These listeners are always active for modals
    closeModalButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.classList.remove('active');
        });
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Apply UI restrictions based on isSharedView flag
function applySharedViewRestrictions() {
    if (isSharedView) {
        // Hide sidebar and associated buttons
        document.querySelector('.sidebar').style.display = 'none';
        document.querySelector('.main-content').style.marginLeft = '0'; // Adjust layout if sidebar hidden

        // Hide management forms/buttons
        thumbnailForm.style.display = 'none';
        shareBoardBtn.style.display = 'none';
        addBoardBtn.style.display = 'none'; // This button is in the sidebar, but redundant

        // Hide edit/delete icons on board list (though sidebar is hidden by CSS)
        // This is primarily handled by CSS now.

        // Hide delete buttons on thumbnails
        document.querySelectorAll('.delete-thumbnail-btn').forEach(btn => {
            btn.style.display = 'none';
        });
    } else {
        // Ensure visibility for normal view (if they were hidden by shared view logic)
        document.querySelector('.sidebar').style.display = ''; // Reset display
        document.querySelector('.main-content').style.marginLeft = ''; // Reset margin

        thumbnailForm.style.display = '';
        shareBoardBtn.style.display = '';
        addBoardBtn.style.display = '';

        document.querySelectorAll('.delete-thumbnail-btn').forEach(btn => {
            btn.style.display = '';
        });
    }
}


// Render the list of boards (only called in normal view)
function renderBoards(boardsData) {
    if (isSharedView) return; // Don't render sidebar if in shared view

    boardList.innerHTML = '';

    if (!activeBoard && boardsData.length === 0) {
        const noBoardItem = document.createElement('li');
        noBoardItem.className = 'board-item active';
        noBoardItem.innerHTML = `<span class="board-item-name">No Boards Yet</span>`;
        boardList.appendChild(noBoardItem);
        return;
    }

    boardsData.forEach(board => {
        const boardItem = document.createElement('li');
        boardItem.className = 'board-item';
        if (activeBoard && board.id === activeBoard.id) {
            boardItem.classList.add('active');
        }

        const boardNameSpan = document.createElement('span');
        boardNameSpan.className = 'board-item-name';
        boardNameSpan.textContent = board.name;
        boardNameSpan.dataset.id = board.id;

        const editButton = document.createElement('button');
        editButton.className = 'edit-board-btn';
        editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editButton.title = 'Edit board name';

        boardNameSpan.addEventListener('click', () => {
            setActiveBoard(board.id);
        });

        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditBoardModal(board);
        });

        boardItem.appendChild(boardNameSpan);
        boardItem.appendChild(editButton);

        boardList.appendChild(boardItem);
    });
}

// Open the edit board modal
function openEditBoardModal(board) {
    editBoardNameInput.value = board.name;
    editBoardIdInput.value = board.id;
    editBoardModal.classList.add('active');
    editBoardNameInput.focus();
}

// Update board name
async function updateBoardName() {
    const boardName = editBoardNameInput.value.trim();
    const boardId = editBoardIdInput.value;

    if (!boardName) {
        showToast('Board name cannot be empty.', false);
        return;
    }

    try {
        const response = await fetch(`/api/boards/${boardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: boardName })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const updatedBoard = await response.json();
        if (activeBoard && activeBoard.id === updatedBoard.id) {
            activeBoard.name = updatedBoard.name;
            activeBoardTitle.textContent = updatedBoard.name;
        }
        showToast('Board name updated!');
        await fetchBoards(); // Re-fetch to update sidebar immediately
    } catch (error) {
        console.error('Error updating board:', error);
        showToast(`Failed to update board: ${error.message}`, false);
    } finally {
        editBoardModal.classList.remove('active');
    }
}

// Delete board
async function deleteBoard() {
    const boardId = editBoardIdInput.value;
    if (!boardId) {
        showToast('No board selected for deletion.', false);
        return;
    }

    if (!confirm('Are you sure you want to delete this board and all its thumbnails? This cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/boards/${boardId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        showToast('Board deleted successfully!');
        editBoardModal.classList.remove('active');

        activeBoard = null; // Clear active board
        history.pushState(null, '', '/'); // Go back to root URL
        await fetchBoards(); // Re-fetch to update the sidebar
    } catch (error) {
        console.error('Error deleting board:', error);
        showToast(`Failed to delete board: ${error.message}`, false);
    }
}

// Render thumbnails for the active board
function renderThumbnails() {
    activeBoardTitle.textContent = activeBoard ? activeBoard.name : 'No Board Selected';

    if (!activeBoard || !activeBoard.thumbnails || activeBoard.thumbnails.length === 0) {
        thumbnailGrid.innerHTML = `
            <div class="empty-state">
                <p>No thumbnails added yet</p>
                <p class="small-text">Add a YouTube video URL to get started</p>
            </div>
        `;
        applySharedViewRestrictions(); // Re-apply in case it was rendered dynamically
        return;
    }

    thumbnailGrid.innerHTML = '';

    activeBoard.thumbnails.forEach(thumbnail => {
        const thumbnailItem = document.createElement('div');
        thumbnailItem.className = 'thumbnail-item';

        thumbnailItem.innerHTML = `
            <div class="thumbnail-img-container">
                <img src="${thumbnail.thumbnail_url}" alt="${thumbnail.title || 'Thumbnail'}" class="thumbnail-img" onerror="this.src='https://via.placeholder.com/640x360/1f1f1f/666666?text=Invalid+Image'">
                <button class="delete-thumbnail-btn" data-id="${thumbnail.id}" data-board-id="${thumbnail.board_id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="thumbnail-info">${thumbnail.title || getHostnameFromUrl(thumbnail.video_url)}</div>
        `;

        if (!isSharedView) { // Only add delete listener if not in shared view
            const deleteBtn = thumbnailItem.querySelector('.delete-thumbnail-btn');
            deleteBtn.addEventListener('click', (e) => deleteThumbnail(e.currentTarget.dataset.boardId, e.currentTarget.dataset.id));
        }

        thumbnailGrid.appendChild(thumbnailItem);
    });
    applySharedViewRestrictions(); // Apply restrictions again after rendering thumbnails
}

// Add a new thumbnail to the active board
async function addThumbnail() {
    const url = thumbnailUrlInput.value.trim();

    if (!url) {
        showToast('Please enter a YouTube video URL.', false);
        return;
    }
    if (!activeBoard) {
        showToast('Please select a board first.', false);
        return;
    }
    if (isSharedView) { // Should not happen if form is hidden, but as a safeguard
        showToast('Cannot add thumbnails in shared view.', false);
        return;
    }

    try {
        const response = await fetch(`/api/boards/${activeBoard.id}/thumbnails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_url: url })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        showToast('Thumbnail added successfully!');
        thumbnailUrlInput.value = '';
        await fetchAndRenderThumbnails(activeBoard.id);
    } catch (error) {
        console.error('Error adding thumbnail:', error);
        showToast(`Failed to add thumbnail: ${error.message}`, false);
    }
}

// Delete a thumbnail
async function deleteThumbnail(boardId, thumbnailId) {
    if (!confirm('Are you sure you want to delete this thumbnail?')) {
        return;
    }
    if (isSharedView) { // Safeguard
        showToast('Cannot delete thumbnails in shared view.', false);
        return;
    }

    try {
        const response = await fetch(`/api/boards/${boardId}/thumbnails/${thumbnailId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        showToast('Thumbnail deleted successfully!');
        await fetchAndRenderThumbnails(activeBoard.id);
    } catch (error) {
        console.error('Error deleting thumbnail:', error);
        showToast(`Failed to delete thumbnail: ${error.message}`, false);
    }
}

// Create a new board
async function createNewBoard(boardName, isInitial = false) {
    if (!boardName) {
        if (!isInitial) showToast('Board name cannot be empty.', false);
        return;
    }
    if (isSharedView) { // Safeguard
        showToast('Cannot create boards in shared view.', false);
        return;
    }

    try {
        const response = await fetch('/api/boards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: boardName })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const newBoard = await response.json();
        showToast('New board created!');
        addBoardModal.classList.remove('active');
        boardNameInput.value = '';

        activeBoard = { id: newBoard.id, name: newBoard.name, thumbnails: [] };
        // Reset URL to default if on a shared board and creating a new one
        if (window.location.pathname.startsWith('/board/')) {
            history.pushState(null, '', `/`);
        }
        await fetchBoards(); // Re-fetch all boards to update sidebar and set new board as active
    } catch (error) {
        console.error('Error creating board:', error);
        showToast(`Failed to create board: ${error.message}`, false);
    }
}

// Set the active board (only called in normal view)
async function setActiveBoard(boardId) {
    if (isSharedView) return; // Cannot switch boards in shared view
    if (activeBoard && activeBoard.id === boardId) return;

    history.pushState(null, '', `/board/${boardId}`); // Update URL

    await fetchAndRenderThumbnails(boardId); // Fetch and render for the new active board
    await fetchBoards(); // Re-render sidebar to highlight active board
}

// Generate a board share link
function getBoardShareLink(boardId) {
    return `${window.location.origin}/board/${boardId}`;
}

// Show toast notification
function showToast(message, success = true) {
    const toastMessage = document.querySelector('.toast-message');
    const toastIcon = document.querySelector('#toast i');

    toastMessage.textContent = message;
    toastIcon.className = success ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toastIcon.style.color = success ? '#4caf50' : '#f44336';

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Helper function to get hostname from URL
function getHostnameFromUrl(url) {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return url;
    }
}
