# Task Collaboration Platform

A real-time task management application similar to Trello, built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

## Features

- **User Authentication**: Secure Signup and Login.
- **Board Management**: Create, view, and manage multiple boards.
- **Task Management**: Create lists and tasks within boards.
- **Drag & Drop**: Intuitive drag-and-drop interface for moving tasks between lists.
- **Real-time Updates**: Instant synchronization across all connected clients using WebSockets.
- **Search & Pagination**: Efficient board navigation.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, @dnd-kit/core, Socket.io-client, Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, JSONWebToken.

## Setup Instructions

### Prerequisites

- Node.js installed
- MongoDB URI (Provided in `.env`)

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project root.

2.  **Install dependencies**:
    ```bash
    # Server
    cd server
    npm install

    # Client
    cd ../client
    npm install
    ```

3.  **Environment Variables**:
    Ensure `server/.env` exists with:
    ```env
    PORT=5000
    # Use local MongoDB if remote is blocked
    MONGO_URI=mongodb://127.0.0.1:27017/taskapp
    JWT_SECRET=your_secret
    CLIENT_URL=http://localhost:5173
    ```

### Running Locally

1.  **Start the Backend**:
    Make sure MongoDB is running locally.
    ```bash
    mongod --dbpath ./data --port 27017 # If not running as service
    ```
    Then:
    ```bash
    cd server
    npm run dev
    ```
    Server runs on `http://localhost:5000`.

2.  **Start the Frontend**:
    ```bash
    cd client
    npm run dev
    ```
    Client runs on `http://localhost:5173`.

## Deployment

The application is ready for deployment on platforms like Render.
- **Backend**: Deploy `server` directory as a Web Service. Add environment variables.
- **Frontend**: Deploy `client` directory as a Static Site. Build command: `npm run build`, Publish directory: `dist`.
