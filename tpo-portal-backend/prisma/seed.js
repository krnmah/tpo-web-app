const prisma = require('../src/config/prismaClient');
const {hashPassword} = require('../src/utils/hash')

async function main() {
  let hashedPassword = await hashPassword("password");
  await prisma.student.createMany({
    data: [
      {
        name: "Test Student",
        enrollmentNumber: "ENR001",
        email: "test@nitsri.ac.in",
        password: hashedPassword,
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
