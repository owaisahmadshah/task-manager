# TaskFlow — Full-Stack Project & Task Management System

**TaskFlow** is a collaborative project and task management web application built as a University Database Management Systems (DBMS) & Full-Stack Engineering project. It combines a normalized **Microsoft SQL Server** relational database (featuring triggers, views, stored procedures, and audit trails) with a lightweight **.NET 10 Minimal API** backend and a responsive **React 19 + TypeScript** frontend.

---

## ✨ Key Features

- **Secure Cookie-Based Authentication:** User registration and login with BCrypt password hashing and JWT tokens stored in `HttpOnly` cookies (`access_token`).
- **Project & Role-Based Access Control (RBAC):** Create projects, invite teammates by email, and manage project-level permissions (`Admin`, `Project Manager`, `Member`).
- **Task & Subtask Management:** Create tasks and nested subtasks, assign team members, set priorities (`Low`, `Medium`, `High`, `Critical`), track statuses (`To Do`, `In Progress`, `In Review`, `Done`), and filter dynamically.
- **Color-Coded Tags & Discussions:** Attach existing or custom color-coded tags to tasks and collaborate via task comments.
- **Automated SQL Audit Trail:** Every change to a task's **Status**, **Priority**, or **Assignee** is automatically recorded in `TaskAuditLogs` via a SQL Server `AFTER UPDATE` trigger (`trg_Tasks_AuditUpdate`).
- **Real-Time Analytics Dashboard:** Aggregated project completion metrics, overdue task tracking, and team workload distribution powered by SQL Server Views (`vw_ProjectSummary`, `vw_UserWorkload`).

---

## 🛠️ Tech Stack

| Layer        | Technologies                                                                            |
| :----------- | :-------------------------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios                        |
| **Backend**  | .NET 10 (ASP.NET Core Minimal APIs), Dapper, BCrypt.Net, JWT Bearer Auth                |
| **Database** | Microsoft SQL Server 2022 (Docker), T-SQL (Triggers, Views, Stored Procedures, Indexes) |

---

## 📂 Repository Structure

```text
task-manager/
├── TaskManager/                     # .NET 10 Minimal API & SQL Server Scripts
│   ├── Data/
│   │   └── DbConnectionFactory.cs   # SQL Server connection factory
│   ├── Database/
│   │   ├── 01_Schema.sql            # 3NF tables, constraints, and non-clustered indexes
│   │   ├── 02_Programmability.sql   # Audit trigger & analytical SQL views
│   │   ├── 03_StoredProcedures.sql  # Transactional stored procedures
│   │   └── 03_SeedData.sql          # Initial seed data for users, projects, and tasks
│   ├── Endpoints/
│   │   ├── AuthEndPoints.cs         # Register, login, logout, and session endpoints
│   │   ├── DashboardEndpoints.cs    # Overview & team workload analytics endpoints
│   │   ├── EndpointsHelper.cs       # Claims & project role helper methods
│   │   ├── ProjectEndpoints.cs      # Project CRUD & member role management
│   │   └── TaskEndpoints.cs         # Task CRUD, filtering, tags, comments & subtasks
│   ├── Models/
│   │   ├── Entities.cs              # Database record models
│   │   ├── Requests.cs              # API request DTOs
│   │   └── Responses.cs             # API response DTOs
│   ├── docker-compose.yml           # SQL Server 2022 container setup
│   ├── Program.cs                   # Middleware, CORS, JWT cookie auth & route mapping
│   ├── TaskManager.csproj
│   └── TaskManager.http             # Ready-to-run HTTP smoke tests
│
└── task-manager-client/             # React + TypeScript Frontend
    ├── src/
    │   ├── api/                     # Axios client & typed API service modules
    │   ├── components/              # Modals, TaskDetailDrawer, Badges, Layout & Guards
    │   ├── context/                 # AuthContext for session state
    │   ├── pages/                   # Dashboard, Projects, ProjectBoard, Login & Register
    │   ├── types/                   # TypeScript interfaces matching backend DTOs
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

---

## 🗄️ Database Architecture Highlights

The database (`TaskManagerDB`) is designed in **Third Normal Form (3NF)** and leverages native SQL Server programmability features:

1. **Tables & Constraints:** `Users`, `Projects`, `ProjectMembers`, `Tasks` (self-referencing `ParentTaskId` for subtasks), `Tags`, `TaskTags`, `TaskComments`, and `TaskAuditLogs`, reinforced with `CHECK` constraints, cascading foreign keys, and composite non-clustered indexes.
2. **Trigger (`trg_Tasks_AuditUpdate`):** Automatically captures before-and-after values in `TaskAuditLogs` whenever a task's `Status`, `Priority`, or `AssigneeId` changes.
3. **Stored Procedures:**
   - `sp_CreateProjectWithOwner`: Atomically creates a project and assigns the creator as `Admin` in `ProjectMembers`.
   - `sp_CreateTaskWithTags`: Validates project membership, inserts the task, and parses comma-separated tag IDs into `TaskTags` inside a single transaction.
4. **Views:** `vw_ProjectTaskDetails`, `vw_ProjectSummary`, and `vw_UserWorkload` pre-join relational data and compute completion/overdue statistics for fast API reads.

---

## 🚀 Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js (v20+)](https://nodejs.org/) & npm
- [Docker & Docker Compose](https://www.docker.com/)

---

### 1. Start SQL Server & Initialize the Database

Navigate to the `TaskManager` backend folder and configure your environment variables:

```bash
cd TaskManager
cp .env.example .env
```

Update `.env` with your credentials (ensure `JWT_SECRET` is at least 32 characters long):

```env
MSSQL_SA_PASSWORD=TaskManager@2026!Db
DB_CONNECTION_STRING=Server=localhost,1433;Database=TaskManagerDB;User Id=sa;Password=TaskManager@2026!Db;TrustServerCertificate=True;
JWT_SECRET=SuperSecretUniversityProjectJwtKey2026!ChangeMeIfNeeded
```

Start the SQL Server container:

```bash
docker compose up -d
```

Once the container is healthy, execute the SQL scripts in `TaskManager/Database/` in order against `localhost,1433` using your SQL client (Azure Data Studio, SSMS, Rider Database Tools, or `sqlcmd`):

1. `01_Schema.sql`
2. `02_Programmability.sql`
3. `03_StoredProcedures.sql`
4. `03_SeedData.sql` _(optional demo data)_

---

### 2. Run the .NET Backend API

From inside the `TaskManager/` directory:

```bash
dotnet restore
dotnet run
```

The API will start on **`http://localhost:5081`** (with OpenAPI docs enabled in Development mode).

---

### 3. Run the React Frontend

Open a new terminal, navigate to `task-manager-client/`, install dependencies, and start the Vite dev server:

```bash
cd task-manager-client
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser, register a new account, and start creating projects and tasks!

---

## 👨‍💻 Contributors

- **Owais** — Database Design (SQL Server Schema, Triggers, Views, Stored Procedures) & .NET 10 Backend API
- **Muhammad Darban** ([@mdalvi11](https://github.com/mdalvi11)) — Frontend Architecture, UI/UX & React + TypeScript Implementation

---

## 📄 License

This project was developed for academic and educational purposes.
