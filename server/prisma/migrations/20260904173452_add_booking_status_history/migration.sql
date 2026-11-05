-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_status_history_bookingId_idx" ON "booking_status_history"("bookingId");

-- CreateIndex
CREATE INDEX "booking_status_history_changedByUserId_idx" ON "booking_status_history"("changedByUserId");

-- CreateIndex
CREATE INDEX "booking_status_history_createdAt_idx" ON "booking_status_history"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_businessId_status_idx" ON "bookings"("businessId", "status");

-- CreateIndex
CREATE INDEX "bookings_businessId_staffId_idx" ON "bookings"("businessId", "staffId");

-- CreateIndex
CREATE INDEX "bookings_businessId_customerId_idx" ON "bookings"("businessId", "customerId");

-- CreateIndex
CREATE INDEX "bookings_businessId_serviceId_idx" ON "bookings"("businessId", "serviceId");

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
