-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "chronicDiseases" TEXT[],
ADD COLUMN     "civilStatus" TEXT,
ADD COLUMN     "currentMedications" TEXT[],
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "occupation" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "_UserDoctorServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserDoctorServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserDoctorServices_B_index" ON "_UserDoctorServices"("B");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserDoctorServices" ADD CONSTRAINT "_UserDoctorServices_A_fkey" FOREIGN KEY ("A") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserDoctorServices" ADD CONSTRAINT "_UserDoctorServices_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
