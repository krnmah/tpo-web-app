import { PrismaClient } from '../generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
    await prisma.student.create({
        data: {
            name: "Karan Maheshwari",
            enrollmentNumber: "2022BCSE023",
            email: "karan_2022bcse023@nitsri.ac.in",
            password: "hashed_password_here",
            department: "CSE",
            batch: 2022,
            tenthMarksheet: "/uploads/10th.pdf",
            twelfthMarksheet: "/uploads/12th.pdf",
            resume: "/uploads/resume.pdf",
            profilePicture: "/uploads/profile.jpg",
            isActivated: true,
        },
    });
}

main()
    .then(() => console.log('Seed data added!'))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
