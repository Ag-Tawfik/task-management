# API Documentation

Base URL: `http://localhost:8000/api`

## Authentication

All task endpoints require cookie-based auth (Laravel Sanctum).

### `POST /auth/login`
- Body: `{ "email": string, "password": string }`
- Success: `200 OK` with user payload
- Errors: `403` for admin accounts, `422` for invalid credentials

### `GET /auth/me`
- Returns current user
- Errors: `401` if unauthenticated

### `POST /auth/logout`
- Logs out the current user
- Success: `200 OK`

## Tasks

All task endpoints are scoped to the authenticated user.

### `GET /tasks`
Query params:
- `search` (string, optional)
- `sort_by` (`created_at|title|status`, optional)
- `sort_dir` (`asc|desc`, optional)
- `per_page` (1-100, optional)
- `page` (1+, optional)

Response: Laravel paginator object with `data` array of tasks.

### `POST /tasks`
- Body: `{ "title": string, "description": string|null, "status": "Pending|In Progress|Completed" }`
- Status defaults to `Pending` if not provided
- Success: `201 Created`

### `GET /tasks/{id}`
- Returns a single task
- Errors: `404` if not found or not owned by user

### `PATCH /tasks/{id}`
- Body: any subset of `{ title, description, status }`
- Success: `200 OK`

### `DELETE /tasks/{id}`
- Success: `204 No Content`

## Health

### `GET /health`
- Public status check
- Success: `200 OK` with `{ ok: true, service: "backend" }`
