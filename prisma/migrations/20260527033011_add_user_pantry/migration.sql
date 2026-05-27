-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pantry" TEXT[] DEFAULT ARRAY[]::TEXT[];
