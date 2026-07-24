import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);


const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Starting database seeding...');

    // 1. Clean up existing data to prevent duplicates on restarts
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    // Common password for testing
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 2. Create users
    const admin = await prisma.user.create({
        data: {
            name: 'Alice Admin',
            email: 'admin@scrum.com',
            passwordHash: hashedPassword,
        }
    });

    const dev = await prisma.user.create({
        data: {
            name: 'Bob Developer',
            email: 'dev@scrum.com',
            passwordHash: hashedPassword,
        }
    });

    // 3. Create a project
    const project = await prisma.project.create({
        data: {
            name: 'E-commerce Platform Redesign',
            description: 'Modernizing our core shopping experience.',
        }
    });

    // 4. Assign roles (RBAC)
    await prisma.projectMember.createMany({
        data: [
            { userId: admin.id, projectId: project.id, role: 'ADMIN' },
            { userId: dev.id, projectId: project.id, role: 'DEVELOPER' }
        ]
    });

    // 5. Create tasks and distribute them across columns
    await prisma.task.createMany({
        data: [
            {
                title: 'Design Checkout Flow',
                description: 'Create wireframes for the new 1-click checkout.',
                status: 'DONE',
                priority: 'HIGH',
                projectId: project.id,
                assigneeId: admin.id,
            },
            {
                title: 'Implement Payment Gateway',
                description: 'Integrate Stripe API for credit card processing.',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                projectId: project.id,
                assigneeId: dev.id,
            },
            {
                title: 'Update Button Styles',
                description: 'Apply new design system colors to all buttons.',
                status: 'REVIEW',
                priority: 'LOW',
                projectId: project.id,
                assigneeId: dev.id,
            },
            {
                title: 'Write API Documentation',
                description: 'Document the new endpoints for the mobile team.',
                status: 'TODO',
                priority: 'MEDIUM',
                projectId: project.id,
            }
        ]
    });

    console.log('Database seeded successfully!');
    console.log('Admin: admin@scrum.com | Password: Password123!');
    console.log('Dev: dev@scrum.com | Password: Password123!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });