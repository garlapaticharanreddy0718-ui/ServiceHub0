-- CreateTable
CREATE TABLE "staff_breaks" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_breaks_staffId_idx" ON "staff_breaks"("staffId");

-- CreateIndex
CREATE INDEX "staff_breaks_staffId_dayOfWeek_idx" ON "staff_breaks"("staffId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "staff_breaks_staffId_dayOfWeek_startTime_endTime_key" ON "staff_breaks"("staffId", "dayOfWeek", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "staff_breaks" ADD CONSTRAINT "staff_breaks_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
