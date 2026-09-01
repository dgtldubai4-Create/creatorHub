-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "openToCreators" BOOLEAN NOT NULL DEFAULT false,
    "kpis" TEXT NOT NULL DEFAULT '{}',
    "tagline" TEXT,
    "deliverables" TEXT NOT NULL DEFAULT '[]',
    "dos" TEXT NOT NULL DEFAULT '[]',
    "donts" TEXT NOT NULL DEFAULT '[]',
    "compensation" TEXT,
    "submissionDeadline" DATETIME,
    "basePoints" INTEGER NOT NULL DEFAULT 100,
    "publicEntry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Campaign" ("basePoints", "brand", "compensation", "createdAt", "deliverables", "donts", "dos", "endDate", "id", "kpis", "name", "objective", "openToCreators", "region", "startDate", "status", "submissionDeadline", "tagline") SELECT "basePoints", "brand", "compensation", "createdAt", "deliverables", "donts", "dos", "endDate", "id", "kpis", "name", "objective", "openToCreators", "region", "startDate", "status", "submissionDeadline", "tagline" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE INDEX "Campaign_status_openToCreators_idx" ON "Campaign"("status", "openToCreators");
CREATE INDEX "Campaign_region_idx" ON "Campaign"("region");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
