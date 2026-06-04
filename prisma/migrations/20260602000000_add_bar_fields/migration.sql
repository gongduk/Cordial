-- AlterTable
ALTER TABLE "Bar" ADD COLUMN IF NOT EXISTS "placeId" TEXT,
                  ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION,
                  ADD COLUMN IF NOT EXISTS "priceLevel" INTEGER,
                  ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER,
                  ADD COLUMN IF NOT EXISTS "purposeTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
                  ADD COLUMN IF NOT EXISTS "analyzedAt" TIMESTAMP(3);

-- CreateIndex (unique, NULL-safe in Postgres)
CREATE UNIQUE INDEX IF NOT EXISTS "Bar_placeId_key" ON "Bar"("placeId");
