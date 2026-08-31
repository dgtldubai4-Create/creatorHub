-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Creator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "handles" TEXT NOT NULL DEFAULT '{}',
    "primaryPlatform" TEXT NOT NULL,
    "followerTier" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "collabType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROSPECT',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "avgScore" REAL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Creator" ("avgScore", "category", "collabType", "createdAt", "email", "followerTier", "handles", "id", "name", "points", "primaryPlatform", "region", "status", "tags") SELECT "avgScore", "category", "collabType", "createdAt", "email", "followerTier", "handles", "id", "name", "points", "primaryPlatform", "region", "status", "tags" FROM "Creator";
DROP TABLE "Creator";
ALTER TABLE "new_Creator" RENAME TO "Creator";
CREATE UNIQUE INDEX "Creator_email_key" ON "Creator"("email");
CREATE INDEX "Creator_region_category_idx" ON "Creator"("region", "category");
CREATE INDEX "Creator_status_followerTier_idx" ON "Creator"("status", "followerTier");
CREATE INDEX "Creator_lifetimePoints_idx" ON "Creator"("lifetimePoints");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
