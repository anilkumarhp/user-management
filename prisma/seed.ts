import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util';
import logger from '../src/utils/logger.utils';

const prisma = new PrismaClient();

async function main() {
  logger.info(`Start seeding ...`);

  const adminEmailInput = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const adminEmail = adminEmailInput.toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!adminPassword) {
    logger.error('DEFAULT_ADMIN_PASSWORD is not set in .env file. Skipping admin user seed.');
    // Do not exit here, allow other seeds to run if any
  } else {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminPassword);
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: hashedPassword,
          fullName: 'System Administrator',
          roles: [UserRole.SYSTEM_ADMIN], // Assign only SYSTEM_ADMIN initially
          mobileCode: "+91",
          mobile: 9087654321,                   
          address: "church street 20",
          pinCode: "5766009",
          isActive: true,
          isEmailVerified: true,
        },
      });
      logger.info(`Created system admin user: ${adminUser.email}`);
    } else {
      // Optionally update existing admin's roles if needed
      // Ensure all roles are correctly typed if spreading from existingAdmin.roles
      const currentRoles = existingAdmin.roles as UserRole[]; // Cast if necessary, though Prisma types should be correct
      if (!currentRoles.includes(UserRole.SYSTEM_ADMIN)) {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { roles: { set: [UserRole.SYSTEM_ADMIN, ...currentRoles.filter(r => r !== UserRole.SYSTEM_ADMIN)] } }, // Add SYSTEM_ADMIN if not present
        });
        logger.info(`Updated roles for system admin user: ${adminEmail} to include SYSTEM_ADMIN.`);
      } else {
        logger.info(`System admin user ${adminEmail} already exists with SYSTEM_ADMIN role.`);
      }
    }
  }

  logger.info(`Seeding finished.`);
}

main()
  .catch((e) => {
    logger.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });