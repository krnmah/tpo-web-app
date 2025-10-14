const prisma = require('../src/config/prismaClient');

async function main() {
  await prisma.student.createMany({
    data: [
      {
        name: "Test Student",
        enrollmentNumber: "ENR001",
        email: "test@nitsri.ac.in",
        password: "hashedpassword",
        department: "CSE",
        batch: 2025,
        tenthMarksheet: "/files/tenth.pdf",
        twelfthMarksheet: "/files/twelfth.pdf",
        resume: "/files/resume.pdf",
        profilePicture: "/files/profile.jpg",
        isActivated: true
      }
    ],
    skipDuplicates: true
  });
}

main()
    .then(() => console.log('Seed data added!'))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
