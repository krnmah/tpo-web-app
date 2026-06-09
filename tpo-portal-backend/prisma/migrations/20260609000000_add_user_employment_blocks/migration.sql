ALTER TABLE "User"
ADD COLUMN "blockedJobTypes" "JobType"[] NOT NULL DEFAULT ARRAY[]::"JobType"[];
