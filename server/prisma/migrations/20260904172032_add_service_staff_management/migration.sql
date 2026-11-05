-- AlterTable
ALTER TABLE "services" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "service_categories" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_services" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_schedules" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_time_off" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_time_off_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_categories_businessId_idx" ON "service_categories"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_businessId_name_key" ON "service_categories"("businessId", "name");

-- CreateIndex
CREATE INDEX "staff_services_staffId_idx" ON "staff_services"("staffId");

-- CreateIndex
CREATE INDEX "staff_services_serviceId_idx" ON "staff_services"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_services_staffId_serviceId_key" ON "staff_services"("staffId", "serviceId");

-- CreateIndex
CREATE INDEX "staff_schedules_staffId_idx" ON "staff_schedules"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_schedules_staffId_dayOfWeek_key" ON "staff_schedules"("staffId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "staff_time_off_staffId_idx" ON "staff_time_off"("staffId");

-- CreateIndex
CREATE INDEX "staff_time_off_staffId_startDateTime_idx" ON "staff_time_off"("staffId", "startDateTime");

-- CreateIndex
CREATE INDEX "services_businessId_isActive_idx" ON "services"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "services_categoryId_idx" ON "services"("categoryId");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_services" ADD CONSTRAINT "staff_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_schedules" ADD CONSTRAINT "staff_schedules_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
