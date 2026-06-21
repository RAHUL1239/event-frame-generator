import { PrismaClient } from "@prisma/client";
import { MKM_EVENT_COLORS } from "../src/lib/mkm-event-colors";
import { MKM_DEFAULT_POSTER_TEMPLATE } from "../src/lib/mkm-poster-template";

const prisma = new PrismaClient();

/** Restore GS flyer poster template + colors on the MKM event. */
async function main() {
  await prisma.event.update({
    where: { slug: "mkm-51st-gauravshali-sohla" },
    data: {
      ...MKM_EVENT_COLORS,
      name: "MARATHI KALA MANDAL WASHINGTON DC",
      subtitle: "PROFILE FRAME & POSTER GENERATOR",
      posterTemplate: JSON.stringify(MKM_DEFAULT_POSTER_TEMPLATE),
    },
  });
  console.log("Restored GS poster template for mkm-51st-gauravshali-sohla");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
