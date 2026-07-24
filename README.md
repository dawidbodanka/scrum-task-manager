# Scrum Task Manager

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

Scrum Task Manager is a full-stack, highly responsive Kanban board application built for modern engineering teams. It features a robust multi-tenant architecture, strict Role-Based Access Control (RBAC), and a seamless Drag-and-Drop interface powered by Optimistic UI updates.

---

## Key Features

* **Advanced Drag & Drop:** Fluid task management utilizing `@dnd-kit` with optimistic UI caching for zero-latency interactions.
* **Role-Based Access Control (RBAC):** 
  * `ADMIN`: Full control over the project, task creation, and team management.
  * `DEVELOPER`: Restricted access – can only update task statuses and self-assign tickets.
* **Multi-Tenant Workspaces:** Users can create and switch between isolated projects securely.
* **Real-time Synchronization:** Background polling ensures the board is always up-to-date with team changes.
* **Security First:** Implements JWT-based authentication, password hashing (bcrypt), and robust backend middleware validation.
* **Modern UI/UX:** Fully responsive design with TailwindCSS, featuring a persistent Dark/Light mode toggle.
* **Containerized:** Fully Dockerized architecture (Frontend, Backend, and Database) for immediate setup and deployment.

---

## Tech Stack

### Frontend
* **Core:** React 19 + TypeScript 6 + Vite 8
* **State Management:** Zustand 5 (Global State) + React Query 5 (Server State & Caching)
* **Styling:** TailwindCSS 4 + Lucide Icons
* **Drag & Drop & Forms:** `@dnd-kit/core` + React Hook Form 7

### Backend
* **Core:** Node.js + Express.js 5 + TypeScript 7
* **Database:** PostgreSQL 16
* **ORM:** Prisma 7 (with modern `@prisma/adapter-pg` for advanced connection pooling)
* **Auth:** JSON Web Tokens (JWT) + `bcryptjs`

### DevOps
* **Docker & Docker Compose**
* **Nginx** (Serving built React assets from an Alpine container)
* Multi-stage Docker builds for optimized container size.

---

## Getting Started

The easiest way to run the application is using Docker. You don't need to install Node.js, PostgreSQL, or any dependencies on your local machine.

### Prerequisites
* Docker Desktop installed and running.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dawidbodanka/Task-Manager.git
   cd scrum-task-manager
   ```

2. Start the containers:
   ```bash
   docker compose up --build
   ```

3. Access the application:
   * Frontend: http://localhost:8080
   * Backend API: http://localhost:3000
   * Database: `localhost:5432`

*Note: On the first run, the backend container automatically pushes the Prisma schema to the PostgreSQL database (`npx prisma db push`). No manual migrations are required!*

---
---

### Demo Accounts (Auto-Seeded)
On the first run, the backend container automatically pushes the Prisma schema to the database and injects sample data (users, a project, and tasks) so you can test the application immediately. No manual migrations required!

Use the following credentials to explore the application and test the RBAC rules:

**Admin Account** *(Full access: create tasks, manage users, delete projects)*
* **Email:** `admin@scrum.com`
* **Password:** `Password123!`

**Developer Account** *(Restricted access: can only update task status and self-assign)*
* **Email:** `dev@scrum.com`
* **Password:** `Password123!`

---

## Architecture Highlights

### The "Optimistic UI" Pattern
To provide a native-like feel, the drag-and-drop mechanism uses **Optimistic UI**. When a user moves a task, the frontend immediately updates the UI and local cache before the server responds. If the server request fails (e.g., due to network issues), the UI automatically rolls back to its previous state.

### Backend Middleware & RBAC
Permissions are enforced at two levels:
1. **Gatekeeping Middleware (`requireProjectRole`):** Intercepts requests and verifies if the user is part of the project and holds the required role before hitting the database.
2. **Business Logic Layer:** For complex actions (like updating a task), the controller evaluates the user's role dynamically - allowing Developers to move tasks while preventing them from editing titles or descriptions.
