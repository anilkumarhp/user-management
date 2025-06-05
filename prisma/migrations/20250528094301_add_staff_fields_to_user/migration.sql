/*
  Warnings:

  - A unique constraint covering the columns `[organization_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('HOSPITAL', 'PHARMACY', 'LAB');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "department" TEXT,
ADD COLUMN     "employee_id" TEXT,
ADD COLUMN     "organization_id" TEXT,
ADD COLUMN     "staff_organization_id" TEXT;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "license_number" TEXT,
    "license_document_s3_path" TEXT,
    "address" TEXT,
    "contact_person_name" TEXT NOT NULL,
    "contact_person_email" TEXT NOT NULL,
    "contact_person_mobile" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "rejection_reason" TEXT,
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_contact_person_email_key" ON "organizations"("contact_person_email");

-- CreateIndex
CREATE INDEX "organizations_contact_person_email_idx" ON "organizations"("contact_person_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_key" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_staff_organization_id_idx" ON "users"("staff_organization_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_staff_organization_id_fkey" FOREIGN KEY ("staff_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
