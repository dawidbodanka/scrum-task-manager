import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();

app.use(cors());
app.use(express.json());

// ============================= MIDDLEWARE =============================

// 1. Main guard - verifies JWT token and extracts user ID
const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: "Access denied. No token provided." });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.headers['x-user-id'] = decoded.userId;
        next();
    } catch (error) {
        res.status(403).json({ error: "Invalid or expired token." });
    }
};

// 2. Project guard - checks if the user has the required role in the project
const requireProjectRole = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.headers['x-user-id'] as string;
            const projectId = (req.body?.projectId || req.query?.projectId) as string;

            if (!userId || !projectId) {
                res.status(400).json({ error: "Missing userId or projectId" });
                return;
            }

            const membership = await prisma.projectMember.findUnique({
                where: { userId_projectId: { userId, projectId } }
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
            console.error("Error in project middleware:", error);
            res.status(500).json({ error: "Error verifying project permissions" });
        }
    }
}

// ============================= USER ENDPOINTS =============================
app.get("/api/users", authenticateToken, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, createdAt: true }
        })
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
})

// ============================= AUTHENTICATION =============================
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Password does not meet complexity requirements." });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "Email already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: { name, email, passwordHash: hashedPassword }
        });

        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: "User registered",
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
    } catch (error) {
        res.status(500).json({ error: "Registration error" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Missing fields" });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: "Login successful",
            user: { id: user.id, name: user.name, email: user.email },
            token
        });
    } catch (error) {
        res.status(500).json({ error: "Login error" });
    }
})

// ============================= PROJECT ENDPOINTS =============================
app.post("/api/projects", authenticateToken, async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.headers['x-user-id'] as string;

        if (!name) return res.status(400).json({ error: "Name is required" });

        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                members: {
                    create: { userId: userId, role: 'ADMIN' }
                }
            }
        });
        res.status(201).json({ project: newProject });
    } catch (error) {
        res.status(500).json({ error: "Error creating project" });
    }
})

app.get("/api/projects", authenticateToken, async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const projects = await prisma.project.findMany({
            where: { members: { some: { userId: userId } } },
            include: {
                members: { where: { userId: userId }, select: { role: true } }
            }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: "Error fetching projects" });
    }
})

app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id as string;
        const userId = req.headers['x-user-id'] as string;

        const membership = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId } }
        });

        if (!membership || membership.role !== 'ADMIN') {
            return res.status(403).json({ error: "Only project admins can delete the project" });
        }

        await prisma.project.delete({ where: { id: projectId } });
        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting project" });
    }
});

// ============================= PROJECT MEMBERS =============================

app.get("/api/projects/:id/members", authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id as string;
        const userId = req.headers['x-user-id'] as string;

        const membership = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId } }
        });

        if (!membership) return res.status(403).json({ error: "Access denied" });

        const members = await prisma.projectMember.findMany({
            where: { projectId },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        const formattedMembers = members.map(m => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            role: m.role
        }));

        res.json(formattedMembers);
    } catch (error) {
        res.status(500).json({ error: "Error fetching members" });
    }
});

app.post("/api/projects/:id/members", authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id as string;
        const userId = req.headers['x-user-id'] as string;
        const { email } = req.body;

        if (!email) return res.status(400).json({ error: "Email is required" });

        const requesterMembership = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId } }
        });

        if (!requesterMembership || requesterMembership.role !== 'ADMIN') {
            return res.status(403).json({ error: "Only admins can invite new members" });
        }

        const userToInvite = await prisma.user.findUnique({ where: { email } });
        if (!userToInvite) {
            return res.status(404).json({ error: "User not found" });
        }

        const existingMember = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId: userToInvite.id, projectId } }
        });

        if (existingMember) {
            return res.status(400).json({ error: "User is already a member" });
        }

        // Add them with the DEVELOPER role based on your Prisma schema
        await prisma.projectMember.create({
            data: {
                userId: userToInvite.id,
                projectId,
                role: 'DEVELOPER'
            }
        });

        res.status(201).json({ message: "Member added successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error adding member" });
    }
});

app.delete("/api/projects/:id/members/:memberId", authenticateToken, async (req, res) => {
    try {
        const projectId = req.params.id as string;
        const memberIdToRemove = req.params.memberId as string;
        const userId = req.headers['x-user-id'] as string;

        const requesterMembership = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId } }
        });

        if (!requesterMembership || requesterMembership.role !== 'ADMIN') {
            return res.status(403).json({ error: "Only admins can remove members" });
        }

        const targetMembership = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId: memberIdToRemove, projectId } }
        });

        if (!targetMembership) {
            return res.status(404).json({ error: "User is not a member" });
        }

        if (userId === memberIdToRemove) {
            return res.status(400).json({ error: "You cannot remove yourself" });
        }

        await prisma.projectMember.delete({
            where: { userId_projectId: { userId: memberIdToRemove, projectId } }
        });

        // Unassign them from all tasks in this project
        await prisma.task.updateMany({
            where: { projectId: projectId, assigneeId: memberIdToRemove },
            data: { assigneeId: null }
        });

        res.json({ message: "Member removed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error removing member" });
    }
});

// ============================= TASK ENDPOINTS =============================

app.get("/api/tasks", authenticateToken, requireProjectRole(['ADMIN', 'DEVELOPER']), async (req, res) => {
    try {
        const projectId = req.query.projectId as string;
        const tasks = await prisma.task.findMany({
            where: { projectId: projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                assignee: { select: { name: true, email: true } }
            }
        })
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Error fetching tasks" });
    }
})

// Only ADMIN can create tasks
app.post("/api/tasks", authenticateToken, requireProjectRole(['ADMIN']), async (req, res) => {
    try {
        // FIX: Extract 'status' from req.body
        const { title, description, priority, status, projectId, assigneeId } = req.body;

        if (!title || !projectId) return res.status(400).json({ error: "Title and projectId are required" });

        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || 'MEDIUM',
                status: status || 'TODO', // FIX: Add status to the creation object
                projectId,
                assigneeId: assigneeId || null
            }
        })
        res.status(201).json({ task: newTask });
    } catch (error) {
        res.status(500).json({ error: "Error creating task" });
    }
})

app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const id = req.params.id as string;
        const { status, assigneeId, title, description, priority } = req.body;
        const userId = req.headers['x-user-id'] as string;

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) return res.status(404).json({ error: "Task not found" });

        const membership = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId: task.projectId } }
        });
        if (!membership) return res.status(403).json({ error: "Access denied" });

        // RULES FOR DEVELOPERS
        if (membership.role === 'DEVELOPER') {
            // Check if they are trying to assign someone else
            if (assigneeId !== undefined && assigneeId !== userId && assigneeId !== null) {
                return res.status(403).json({ error: "Developers can only assign tasks to themselves" });
            }

            // Update ONLY status and assigneeId (ignore title, description, priority changes)
            const updatedTask = await prisma.task.update({
                where: { id },
                data: { status, assigneeId }
            });
            return res.json(updatedTask);
        }

        // RULES FOR ADMIN (Can update everything)
        const updatedTask = await prisma.task.update({
            where: { id },
            data: { status, assigneeId, title, description, priority }
        })
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
        const id = req.params.id as string;
        const userId = req.headers['x-user-id'] as string;

        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) return res.status(404).json({ error: "Task not found" });

        const membership = await prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId: task.projectId } }
        });

        // Only ADMIN can delete tasks
        if (!membership || membership.role !== 'ADMIN') {
            return res.status(403).json({ error: "Only admins can delete tasks" });
        }

        await prisma.task.delete({ where: { id } });
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting task" });
    }
})

// ============================= SERVER =============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});