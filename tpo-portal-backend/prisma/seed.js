const prisma = require('../src/config/prismaClient');
const { hashPassword } = require('../src/utils/auth');

async function main() {
  console.log('🌱 Seeding database...');

  // Create/Update Admin user with strong password
  const adminPassword = await hashPassword('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nitsri.ac.in' },
    update: {
      password: adminPassword
    },
    create: {
      email: 'admin@nitsri.ac.in',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin created/updated:', admin.email);

  console.log('\n🎉 Seeding complete!');
  console.log('\n📝 Login credentials:');
  console.log('   👑 Admin:    admin@nitsri.ac.in / Admin@123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
