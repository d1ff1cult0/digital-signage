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
  console.log("Seeding database...");

  for (const screen of SCREENS) {
    await prisma.screen.upsert({
      where: { id: SCREENS.indexOf(screen) + 1 },
      update: {},
      create: screen,
    });
  }

  console.log(`Created ${SCREENS.length} screens`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
