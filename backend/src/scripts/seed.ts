import { prisma } from '../prisma';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'admin@crumbpanel.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const password = await bcrypt.hash('ChangeMe123!', 10);
    await prisma.user.create({
      data: { email, username: 'admin', password, role: 'admin' }
    });
    console.log('Seeded default admin: admin@crumbpanel.local / ChangeMe123!');
  } else {
    console.log('Admin already exists, skipping seed.');
  }
}
main().finally(() => prisma.$disconnect());
