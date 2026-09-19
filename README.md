# Real-Time Client Project Dashboard

A full-stack practice project for managing client projects, tasks,
developers, activity logs, notifications, and task status updates.

The application demonstrates role-based access control, authentication,
database operations, and real-time communication.

---

## 🚀 Features

### Authentication

- User registration
- User login
- JWT access tokens
- Refresh tokens
- HttpOnly refresh-token cookie
- Password hashing using bcrypt
- Protected API routes

### Role-Based Access Control

The application supports three roles:

- Admin
- Project Manager
- Developer

Protected backend routes verify the authenticated user's role before
allowing access.

### Project Management

Project Managers can:

- Create projects
- View their projects
- View developers
- Create tasks
- Assign tasks to developers

### Developer Dashboard

Developers can:

- View assigned tasks
- Search tasks
- View project information
- View task priority
- View due dates
- Update task status
- View notifications

### Task Management

Supported task statuses:

- To Do
- In Progress
- In Review
- Completed

Supported priorities:

- Low
- Medium
- High
- Critical

### Real-Time Updates

Socket.IO is used for real-time communication.

The application supports live:

- Task status updates
- Notifications
- Activity updates

### Notifications

Developers receive notifications when:

- A new task is assigned
- A task becomes overdue

Unread notification counts are also displayed.

### Overdue Tasks

A scheduled backend job checks tasks periodically.

Tasks that pass their due date while remaining incomplete are marked
as overdue in the dashboard and can generate notifications.

### Dashboard UI

The dashboard includes:

- Summary cards
- Task search
- Priority badges
- Overdue indicators
- Responsive layouts
- Mobile-friendly styling
- Activity feed
- Notification section

---

# 🛠️ Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Socket.IO Client
- CSS

## Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- JWT
- bcrypt
- node-cron

## Database

- PostgreSQL
- Prisma ORM

---

# 📁 Project Structure

```text
client-dashboard-practice/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── activities/
│   │   ├── jobs/
│   │   ├── notifications/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── users/
│   │   ├── socket.ts
│   │   ├── server.ts
│   │   └── lib/
│   │
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── README.md
└── .gitignore