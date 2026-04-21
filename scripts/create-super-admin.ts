import 'reflect-metadata';
import { PrismaService } from '../src/prisma/prisma.service';
import { User, UserRole } from '../src/modules/identity/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function createSuperUser() {
  const prisma = new PrismaService();

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@sociotech.com' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    const passwordHash = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: 'admin@sociotech.com',
        passwordHash,
        role: UserRole.ADMIN,
        firstName: 'Super',
        lastName: 'Admin',
        isActive: true,
      },
    });

    console.log('✅ Super admin created successfully!');
    console.log('   Email: admin@sociotech.com');
    console.log('   Password: admin123');
    console.log('   Role: ADMIN');
  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperUser();