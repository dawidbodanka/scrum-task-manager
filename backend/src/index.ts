import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();

app.use(cors());
app.use(express.json());

// ============================= Middleware =============================
const requireProjectRole = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // who sent the request?
            const userId = req.headers['x-user-id'] as string;

            // which project is being accessed? 
            const projectId = req.body.projectId || req.query.projectId;

            if (!userId || !projectId) {
                res.status(400).json({ error: "Missing userId or projectId" });
                return;
            }

            // check if the user has one of the allowed roles for the project
            const membership = await prisma.projectMember.findUnique({
                where: {
                    userId_projectId: { userId, projectId }
                }
            });

            if (!membership) {
                res.status(403).json({ error: "User is not a member of this project" });
                return;
            }

            if (!allowedRoles.includes(membership.role)) {
                res.status(403).json({ error: "User does not have the required role" });
                return;
            }

            next();
        } catch (error) {
            console.error("Error in middleware:", error);
            res.status(500).json({ error: "Error in middleware" });
        }
    }
}

// ============================= TEST ENDOINT =============================
app.get('/', async (req, res) => {
    try {
        const usersCount = await prisma.user.count();
        res.json({
            message: 'Server is running on port ' + PORT + '!',
            usersCount
        });
    } catch (error) {
        console.error("Connection error:", error);
        res.status(500).json({ error: "Cannot connect to the database" });
    }
});


// ============================= USER ENDPOINTS =============================
// Get all users (GET /api/users)
app.get("/api/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { // DONT RETURN PASSWORDS !!!
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        })
        res.json(users);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Error fetching users" });
    }
})

// Create a new user (POST /api/users)
app.post("/api/users", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: password // LATER REPLACE WITH HASHING
            }
        })
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                createdAt: newUser.createdAt
            }
        })
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Error creating user" });
    }
})

// ============================= PROJECT ENDPOINTS =============================
// Create a new project (POST /api/projects)
app.post("/api/projects", async (req, res) => {
    try {
        const { name, description } = req.body;
        // ZMIANA: Pobieramy userId z nagłówka, tak samo jak w middleware
        const userId = req.headers['x-user-id'] as string;

        if (!name || !userId) {
            return res.status(400).json({ error: "Name and userId (in header) are required" });
        }
        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                members: {
                    create: {
                        userId: userId,
                        role: 'ADMIN'
                    }
                }
            }
        });
        res.status(201).json({
            message: "Project created successfully",
            project: newProject
        });
    }
    catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: "Error creating project" });
    }
})

// Get all projects assigned to a user (GET /api/projects)
app.get("/api/projects", async (req, res) => {
    try {
        // ZMIANA: Pobieramy userId z nagłówka, a nie z req.query
        const userId = req.headers['x-user-id'] as string;

        if (!userId) {
            return res.status(400).json({ error: "x-user-id header is required" });
        }
        const projects = await prisma.project.findMany({
            where: {
                members: {
                    some: { userId: userId }
                }
            },
            include: {
                members: {
                    where: { userId: userId },
                    select: { role: true }
                }
            }
        });
        res.json(projects);
    }
    catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "Error fetching projects" });
    }
})

// ============================= TASK ENDPOINTS =============================
//Get all tasks for a specific project (GET /api/tasks)
app.get("/api/tasks", async (req, res) => {
    try {
        const projectId = req.query.projectId as string;

        if (!projectId) {
            return res.status(400).json({ error: "projectId query parameter is required" });
        }

        const tasks = await prisma.task.findMany({
            where: { projectId: projectId },
            orderBy: { createdAt: 'desc' }, // Newest tasks first
            include: {
                assignee: {
                    select: { name: true, email: true } // Return only name and email of the assignee
                }
            }
        })
        res.json(tasks);
    }
    catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Error fetching tasks" });
    }
})

// Create a new task (POST /api/tasks)
app.post("/api/tasks", requireProjectRole(['ADMIN']), async (req, res) => {
    try {
        const { title, description, priority, projectId, assigneeId } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({ error: "Title and projectId are required" });
        }

        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM', // Default priority if not provided
                projectId,
                assigneeId: assigneeId || null // Allow null if no assignee is provided
            }
        })
        res.status(201).json({
            message: "Task created successfully",
            task: newTask
        });
    }
    catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ error: "Error creating task" });
    }
})

// Update task (PATCH /api/tasks/:id)
app.patch("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assigneeId, title, description, priority } = req.body;

        const updatedTask = await prisma.task.update({
            where: { id: id },
            data: {
                status,
                assigneeId,
                title,
                description,
                priority
            }
        })
        res.json(updatedTask);
    }
    catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Error updating task" });
    }
});

// Delete task (DELETE /api/tasks/:id)
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({
            where: { id: id }
        });
        res.json({ message: "Task deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Error deleting task" });
    }
})

// ============================= SERVER =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});