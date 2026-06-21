import { PrismaClient } from "@prisma/client";
import { MKM_EVENT_COLORS } from "../src/lib/mkm-event-colors";

const prisma = new PrismaClient();

/** Restore MKM purple/gold colors from production. */
async function main() {
  await prisma.event.update({
    where: { slug: "mkm-51st-gauravshali-sohla" },
    data: {
      ...MKM_EVENT_COLORS,
      name: "MARATHI KALA MANDAL WASHINGTON DC",
      subtitle: "PROFILE FRAME & POSTER GENERATOR",
    },
  });
  console.log("Restored MKM colors for mkm-51st-gauravshali-sohla");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
