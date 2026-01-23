-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('LARGE', 'MIDSIZE', 'SMALL', 'OTHER');

-- CreateTable
CREATE TABLE "Organization" (
    "org_id" SERIAL NOT NULL,
    "org_did" VARCHAR(255) NOT NULL,
    "org_name" VARCHAR(255) NOT NULL,
    "org_type" "OrgType" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("org_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_org_did_key" ON "Organization"("org_did");
