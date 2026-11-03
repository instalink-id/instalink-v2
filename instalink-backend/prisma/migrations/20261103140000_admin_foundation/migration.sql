DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "UserRole"
        GROUP BY "userId"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot enforce one role per user while duplicate assignments exist';
    END IF;
END $$;

ALTER TYPE "AuditAction" ADD VALUE 'USER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_ROLE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_PASSWORD_RESET';
ALTER TYPE "AuditAction" ADD VALUE 'USER_PASSWORD_CHANGED';

ALTER TABLE "User"
    ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "passwordChangeExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "UserRole_userId_key" ON "UserRole"("userId");
