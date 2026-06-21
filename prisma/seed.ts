import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MKM_EVENT_COLORS } from "../src/lib/mkm-event-colors";
import { MKM_DEFAULT_POSTER_TEMPLATE } from "../src/lib/mkm-poster-template";

const prisma = new PrismaClient();

const MKM_EVENT_HIGHLIGHTS = [
  "Droumavalla Farm\nLeesburg, VA",
  "July 17, 2026\nVIP Gala Night",
  "July 18, 2026\nGrand Celebration",
  "Felicitation of seniors",
];

const MKM_POSTER_TEMPLATE = MKM_DEFAULT_POSTER_TEMPLATE;

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "changeme",
    12
  );

  await prisma.adminUser.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@example.com" },
    update: { passwordHash },
    create: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      passwordHash,
      name: "Admin",
    },
  });

  const defaultEnabledFrameThemes = JSON.stringify([
    "gauravshali-sohla",
    "traditional-maharashtrian",
    "elegant-gold",
  ]);

  const eventDefaults = {
    name: "MARATHI KALA MANDAL WASHINGTON DC",
    tagline: "सोहळा कौतुकाचा, सन्मान ज्येष्ठांचा, उत्साह नव्या पिढीचा…",
    dateLabel: "July 17th & 18th, 2026",
    eventDate: new Date("2026-07-17T12:00:00.000Z"),
    location: "Leesburg",
    subtitle: "PROFILE FRAME & POSTER GENERATOR",
    isActive: true,
    logoUrl: "/mkm-logo.png",
    ...MKM_EVENT_COLORS,
    enabledFrameThemes: defaultEnabledFrameThemes,
    eventHighlights: JSON.stringify(MKM_EVENT_HIGHLIGHTS),
    posterTemplate: JSON.stringify(MKM_POSTER_TEMPLATE),
  };

  const existingEvent = await prisma.event.findUnique({
    where: { slug: "mkm-51st-gauravshali-sohla" },
  });

  const event = existingEvent
    ? await prisma.event.update({
        where: { slug: "mkm-51st-gauravshali-sohla" },
        data: {
          ...(existingEvent.posterTemplate
            ? {}
            : { posterTemplate: eventDefaults.posterTemplate }),
          ...(existingEvent.enabledFrameThemes
            ? {}
            : { enabledFrameThemes: eventDefaults.enabledFrameThemes }),
          ...(existingEvent.eventHighlights
            ? {}
            : { eventHighlights: eventDefaults.eventHighlights }),
        },
      })
    : await prisma.event.create({
        data: {
          slug: "mkm-51st-gauravshali-sohla",
          ...eventDefaults,
        },
      });

  const genderOptions = [
  {
    key: "female",
    label: "Female: मी जातेय...",
    tagline: "मी जातेय MKM 51st Gauravshali Sohla",
    sortOrder: 0,
  },
  {
    key: "male",
    label: "Male: मी जातोय...",
    tagline: "मी जातोय MKM 51st Gauravshali Sohla",
    sortOrder: 1,
  },
  {
    key: "group",
    label: "Group: आम्ही जातोय...",
    tagline: "आम्ही जातोय MKM 51st Gauravshali Sohla",
    sortOrder: 2,
  },
];

  for (const option of genderOptions) {
    await prisma.genderOption.upsert({
      where: { eventId_key: { eventId: event.id, key: option.key } },
      update: {},
      create: { eventId: event.id, ...option },
    });
  }

  console.log("Seeded event:", event.slug);
  console.log("Admin:", process.env.ADMIN_EMAIL || "admin@example.com");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
