-- AlterEnum
ALTER TYPE "public"."BookingStatus" ADD VALUE 'confirmed';

-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "attendeeEmail" TEXT,
ADD COLUMN     "attendeeName" TEXT,
ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "videoLink" TEXT,
ADD COLUMN     "videoProvider" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateTable
CREATE TABLE "public"."AvailabilityBlock" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "timezone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarIntegration" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'google-calendar',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "calendarId" TEXT NOT NULL DEFAULT 'primary',
    "syncToken" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'disconnected',
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEvent" (
    "id" UUID NOT NULL,
    "calendarIntegrationId" UUID NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "isBusy" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvailabilityBlock_userId_dayOfWeek_idx" ON "public"."AvailabilityBlock"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_userId_isActive_idx" ON "public"."AvailabilityBlock"("userId", "isActive");

-- CreateIndex
CREATE INDEX "CalendarIntegration_userId_type_idx" ON "public"."CalendarIntegration"("userId", "type");

-- CreateIndex
CREATE INDEX "CalendarIntegration_syncStatus_idx" ON "public"."CalendarIntegration"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarIntegration_userId_type_key" ON "public"."CalendarIntegration"("userId", "type");

-- CreateIndex
CREATE INDEX "CalendarEvent_calendarIntegrationId_startTime_idx" ON "public"."CalendarEvent"("calendarIntegrationId", "startTime");

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_endTime_idx" ON "public"."CalendarEvent"("startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_calendarIntegrationId_externalEventId_key" ON "public"."CalendarEvent"("calendarIntegrationId", "externalEventId");

-- CreateIndex
CREATE INDEX "Booking_userId_startTime_idx" ON "public"."Booking"("userId", "startTime");

-- CreateIndex
CREATE INDEX "Booking_startTime_endTime_idx" ON "public"."Booking"("startTime", "endTime");

-- AddForeignKey
ALTER TABLE "public"."AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarIntegration" ADD CONSTRAINT "CalendarIntegration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_calendarIntegrationId_fkey" FOREIGN KEY ("calendarIntegrationId") REFERENCES "public"."CalendarIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
