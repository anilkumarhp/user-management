-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMA_ADMIN', 'LAB_ADMIN', 'SYSTEM_ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT,
    "roles" "UserRole"[] DEFAULT ARRAY['PATIENT']::"UserRole"[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
