-- Max is the default plan: new accounts start on it and accounts without a paid plan move to it.
ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'MAX';
UPDATE "User" SET "plan" = 'MAX' WHERE "plan" = 'FREE';
