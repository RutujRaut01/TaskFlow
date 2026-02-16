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

## Architecture

TaskFlow utilizes a Client-Server architecture powered by the MERN stack.
- **Client**: Single Page Application (SPA) built with React. It uses `Context API` for global state management (Auth, Board state) and `Socket.io-client` to listen for real-time events.
- **Server**: RESTful API built with Express.js. It handles HTTP requests for CRUD operations and maintains persistent WebSocket connections via `Socket.io` for real-time broadcasting.
- **Database**: MongoDB stores relational data (Users, Boards, Lists, Tasks) using Mongoose for schema modeling.

## Assumptions

- **Single Tenancy within Boards**: All users with access to a board can modify it. We assume a high-trust environment among collaborators.
- **Connectivity**: The application is designed for online use. Offline capabilities are currently limited.
- **Modern Browsers**: We assume users are on up-to-date browsers that support ES6+ features and WebSockets.

## Trade-offs

- **Context API vs Redux**: We chose React's built-in Context API over Redux. **Pros**: Less boilerplate, native integration. **Cons**: Potential performance bottlenecks with frequent high-frequency updates (mitigated by component composition), less dev tooling than Redux DevTools.
- **Socket.io vs Native WebSockets**: We use Socket.io. **Pros**: Automatic reconnection, room support, fallback to polling. **Cons**: Slightly heavier client/server payload than raw WebSockets.
- **Monolithic Backend**: The backend is a structured monolith. **Pros**: Easier to deploy (single Render service), shared code/types potential, simpler debugging. **Cons**: Scales as a whole block; cannot scale just the "Task" service independently.

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
