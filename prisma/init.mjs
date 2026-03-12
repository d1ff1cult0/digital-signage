import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SCREENS = [
  { name: "Screen 1 — Lobby", description: "Main entrance lobby display" },
  { name: "Screen 2 — Cafeteria", description: "Cafeteria / break room display" },
  { name: "Screen 3 — Conference Room A", description: "Large conference room" },
  { name: "Screen 4 — Conference Room B", description: "Small conference room" },
  { name: "Screen 5 — Reception", description: "Front desk reception area" },
  { name: "Screen 6 — Hallway 2F", description: "Second floor hallway" },
  { name: "Screen 7 — Warehouse", description: "Warehouse entrance display" },
];

async function main() {
  console.log("Initializing database...");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Admin" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "username" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Screen" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Media" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "filename" TEXT NOT NULL,
      "originalName" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Media_filename_key" ON "Media"("filename")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Schedule" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "screenId" INTEGER NOT NULL,
      "mediaId" INTEGER NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Schedule_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Schedule_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  console.log("Tables ready.");

  const screenCount = await prisma.screen.count();
  if (screenCount === 0) {
    console.log("First run — seeding default screens...");
    for (const screen of SCREENS) {
      await prisma.screen.create({ data: screen });
    }
    console.log(`Seeded ${SCREENS.length} screens.`);
  } else {
    console.log(`Database already has ${screenCount} screens, skipping seed.`);
  }
}

main()
  .catch((e) => {
    console.error("Init failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
