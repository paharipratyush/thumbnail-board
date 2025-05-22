# Thumbnail Board

![Thumbnail Board Screenshot](https://github.com/paharipratyush/thumbnail-board/blob/main/thumbnail-board-overview.png?raw=true)

## 💡 Project Idea & Problem Solved

The Thumbnail Board is a web application designed to be a "painkiller" for YouTubers and their thumbnail designers. In the fast-paced world of YouTube content creation, finding inspiration and curating references for compelling thumbnails is a constant challenge.

This tool allows users to:
1.  **Paste any YouTube video link** and automatically extract its highest-quality thumbnail.
2.  **Organize these thumbnails into distinct "boards"** (e.g., "Gaming Thumbnails," "Vlog Style Inspiration," "Competitor Analysis").
3.  **Share a unique link to any board** with their thumbnail designer, eliminating the need for cumbersome manual sharing of images or links.

This streamlines the inspiration gathering process, making collaboration between creators and designers more efficient and organized.

## ✨ Features

* **Board Management:** Create, rename, and delete custom thumbnail boards.
* **YouTube Thumbnail Extraction:** Automatically fetches the highest quality thumbnail from a given YouTube video URL.
* **Thumbnail Curation:** Add and remove thumbnails from any board.
* **Shareable Boards:** Generate unique, read-only links for specific boards to share with designers or team members.
* **Responsive Design:** User interface adapts to various screen sizes.
* **Persistent Data:** All boards and thumbnails are stored in an SQLite database.

## 🚀 Technologies Used

* **Backend:**
    * **Flask:** A lightweight Python web framework.
    * **SQLite3:** A file-based SQL database for data storage.
    * **`requests`:** For making HTTP requests to fetch thumbnail data.
    * **`Flask-CORS`:** To handle Cross-Origin Resource Sharing for API requests.
* **Frontend:**
    * **HTML5:** Structure of the web pages.
    * **CSS3:** Styling, including a dark theme inspired by YouTube.
    * **JavaScript (Vanilla JS):** Client-side logic for dynamic content, API interactions, and UI management.
    * **Font Awesome:** For icons.
    * **Google Fonts (Roboto):** For consistent typography.

## 📦 Project Structure
thumbnail-board/
├── app.py                  # Flask application (backend)
├── thumbnails.db           # SQLite database (generated at runtime, excluded from Git)
├── templates/
│   └── index.html          # Main HTML template
└── static/
├── css/
│   └── styles.css      # Frontend CSS styles
└── js/
└── app.js          # Frontend JavaScript

## 🛠️ Setup and Installation

Follow these steps to get the Thumbnail Board running on your local machine.

### Prerequisites

* Python 3.7+
* pip (Python package installer)
* Git (for cloning the repository)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/thumbnail-board.git](https://github.com/your-username/thumbnail-board.git)
    cd thumbnail-board
    ```
    (Replace `your-username` with your actual GitHub username)

2.  **Create a Python Virtual Environment (Recommended):**
    This isolates your project dependencies from other Python projects.
    ```bash
    python3 -m venv venv
    ```

3.  **Activate the Virtual Environment:**
    * **On macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```
    * **On Windows (Command Prompt):**
        ```bash
        venv\Scripts\activate.bat
        ```
    * **On Windows (PowerShell):**
        ```bash
        venv\Scripts\Activate.ps1
        ```
    (Your terminal prompt should now show `(venv)` indicating the virtual environment is active.)

4.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Run the Flask Application:**
    ```bash
    python app.py
    ```
    You should see output indicating the Flask development server is running, typically on `http://127.0.0.1:5000/`.

6.  **Access the Application:**
    Open your web browser and navigate to `http://127.0.0.1:5000/`.

    The `thumbnails.db` file will be automatically created in your project root the first time `app.py` runs, if it doesn't already exist.

## ⚙️ Usage

### Creating and Managing Boards
1.  **Add New Board:** Click the "<i class="fas fa-plus"></i> Add New Board" button in the sidebar. Enter a name in the modal and click "Create Board."
2.  **Switch Boards:** Click on any board name in the sidebar to make it the active board. The main content area will update to show its thumbnails.
3.  **Edit Board Name:** Click the <i class="fas fa-pencil-alt"></i> icon next to a board name in the sidebar. You can update the name or delete the board from the modal.

### Adding Thumbnails
1.  Ensure you have an active board selected.
2.  Paste a full YouTube video URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ` or `https://youtu.be/dQw4w9WgXcQ`) into the input field.
3.  Click "Add Thumbnail." The thumbnail will appear in the grid.

### Deleting Thumbnails
1.  Hover over a thumbnail in the grid.
2.  Click the red <i class="fas fa-times"></i> button that appears in the top right corner of the thumbnail.

### Sharing a Board
1.  Select the board you wish to share.
2.  Click the "<i class="fas fa-share-alt"></i> Share Board" button in the main content header.
3.  A modal will appear with a unique shareable URL (e.g., `http://127.0.0.1:5000/board/YOUR_BOARD_ID`).
4.  Click the <i class="fas fa-copy"></i> button to copy the link to your clipboard.
5.  Anyone with this link will be able to view the board's thumbnails, but they will not be able to add, edit, or delete anything.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements, new features, or bug fixes, please:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new awesome feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to a clean and readable style.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE.md).

---
