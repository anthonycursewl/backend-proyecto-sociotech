-- AlterTable
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL,
ALTER COLUMN "passwordHash" SET DEFAULT 'replicated_from_auth';
