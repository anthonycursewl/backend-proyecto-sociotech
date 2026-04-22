import 'reflect-metadata';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/modules/identity/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

async function seedSystemRoles() {
  const prisma = new PrismaService();

  try {
    console.log('🌱 Starting system seed...\n');

    const existingOwner = await prisma.user.findUnique({
      where: { email: 'owner@sociotech.com' },
    });

    if (!existingOwner) {
      const passwordHash = await bcrypt.hash('owner123', 12);
      
      await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: 'owner@sociotech.com',
          passwordHash,
          role: UserRole.OWNER,
          firstName: 'System',
          lastName: 'Owner',
          isActive: true,
        },
      });
      console.log('✅ OWNER created: owner@sociotech.com / owner123');
    } else {
      console.log('ℹ️  OWNER already exists');
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@sociotech.com' },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 12);
      
      await prisma.user.create({
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
      console.log('✅ ADMIN created: admin@sociotech.com / admin123');
    } else {
      console.log('ℹ️  ADMIN already exists');
    }

    console.log('\n🎉 System seed completed!\n');
    console.log('Available roles:');
    console.log('  - OWNER: Full system access (cannot be modified)');
    console.log('  - ADMIN: User management + clinical + scheduling');
    console.log('  - DOCTOR: Medical records + appointments');
    console.log('  - SECRETARY: Appointments management');
    console.log('  - PATIENT: View own records + appointments');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedSystemRoles();