# TaskFlow API Documentation

Base URL: `/api`

## Authentication

### Register User
**URL:** `/auth/register`
**Method:** `POST`
**Body:**
```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword"
}
```
**Response:**
```json
{
    "token": "jwt_token_here",
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com"
}
```

### Login User
**URL:** `/auth/login`
**Method:** `POST`
**Body:**
```json
{
    "email": "john@example.com",
    "password": "securepassword"
}
```
**Response:**
```json
{
    "token": "jwt_token_here",
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com"
}
```

### Get Current User
**URL:** `/auth/me`
**Method:** `GET`
**Headers:** `Authorization: Bearer <token>`
**Response:** User object

---

## Boards

### Get All Boards
**URL:** `/boards`
**Method:** `GET`
**Headers:** `Authorization: Bearer <token>`
**Query Params:** `page` (optional), `search` (optional)
**Response:**
```json
{
    "boards": [ ... ],
    "currentPage": 1,
    "totalPages": 5,
    "totalBoards": 42
}
```

### Create Board
**URL:** `/boards`
**Method:** `POST`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
    "title": "Project Roadmap"
}
```
**Response:** Created Board object

### Get Single Board
**URL:** `/boards/:id`
**Method:** `GET`
**Headers:** `Authorization: Bearer <token>`
**Response:** Board object with populated Lists and Tasks

### Update Board
**URL:** `/boards/:id`
**Method:** `PUT`
**Headers:** `Authorization: Bearer <token>`
**Body:** `{"title": "New Title"}`
**Response:** Updated Board object

### Delete Board
**URL:** `/boards/:id`
**Method:** `DELETE`
**Headers:** `Authorization: Bearer <token>`
**Response:** `{"message": "Board removed"}`

---

## Lists

### Create List
**URL:** `/lists`
**Method:** `POST`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
    "title": "To Do",
    "boardId": "board_id_here"
}
```
**Response:** Created List object

### Update List
**URL:** `/lists/:id`
**Method:** `PUT`
**Headers:** `Authorization: Bearer <token>`
**Body:** `{"title": "Doing"}`
**Response:** Updated List object

### Delete List
**URL:** `/lists/:id`
**Method:** `DELETE`
**Headers:** `Authorization: Bearer <token>`
**Response:** `{"message": "List removed"}`

---

## Tasks

### Create Task
**URL:** `/tasks`
**Method:** `POST`
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
    "title": "Fix login bug",
    "description": "Optional description",
    "listId": "list_id_here",
    "boardId": "board_id_here",
    "priority": "High",
    "deadline": "2023-12-31"
}
```
**Response:** Created Task object

### Update Task
**URL:** `/tasks/:id`
**Method:** `PUT`
**Headers:** `Authorization: Bearer <token>`
**Body:** Any subset of task fields (title, description, priority, deadline, listId)
**Response:** Updated Task object

### Delete Task
**URL:** `/tasks/:id`
**Method:** `DELETE`
**Headers:** `Authorization: Bearer <token>`
**Response:** `{"message": "Task removed"}`
