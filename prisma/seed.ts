import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MKM_EVENT_COLORS } from "../src/lib/mkm-event-colors";

const prisma = new PrismaClient();

const MKM_EVENT_HIGHLIGHTS = [
  "Droumavalla Farm\nLeesburg, VA",
  "July 17, 2026\nVIP Gala Night",
  "July 18, 2026\nGrand Celebration",
  "Felicitation of seniors",
];

const MKM_POSTER_TEMPLATE = {
  hashtag: "#MKM51",
  headline: [
    { text: "JOIN US FOR", color: "accent" },
    { text: "गौरवशाली सोहळा", color: "primary" },
    { text: "Celebrating 51 Years of Marathi Kala Mandal", color: "primary" },
  ],
  venueLine: "Droumavalla Farm, Leesburg, VA",
  stats: [
    { value: "51", label: "Years of MKM", color: "accent" },
    { value: "2", label: "Days Celebration", color: "primary" },
    { value: "250+", label: "Community Performers", color: "green" },
    { value: "DMV", label: "Marathi Community", color: "gold" },
  ],
  ticketUrl: "https://mkm51.marathi.com/tickets.html",
  qrUrl: "https://mkm51.marathi.com/tickets.html",
  website: "mkm51.marathi.com/tickets",
  socialHandle: "/mkmdc1",
};

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

  const event = await prisma.event.upsert({
    where: { slug: "mkm-51st-gauravshali-sohla" },
    update: {
      name: "MARATHI KALA MANDAL WASHINGTON DC",
      tagline: "सोहळा कौतुकाचा, सन्मान ज्येष्ठांचा, उत्साह नव्या पिढीचा…",
      dateLabel: "July 17th & 18th, 2026",
      eventDate: new Date("2026-07-17T12:00:00.000Z"),
      location: "Leesburg",
      subtitle: "PROFILE FRAME & POSTER GENERATOR",
      isActive: true,
      logoUrl: "/mkm-logo.png",
      ...MKM_EVENT_COLORS,
      enabledFrameThemes: JSON.stringify([
        "gauravshali-sohla",
        "traditional-maharashtrian",
        "elegant-gold",
      ]),
      eventHighlights: JSON.stringify(MKM_EVENT_HIGHLIGHTS),
      posterTemplate: JSON.stringify(MKM_POSTER_TEMPLATE),
    },
    create: {
      slug: "mkm-51st-gauravshali-sohla",
      name: "MARATHI KALA MANDAL WASHINGTON DC",
      subtitle: "PROFILE FRAME & POSTER GENERATOR",
      tagline: "सोहळा कौतुकाचा, सन्मान ज्येष्ठांचा, उत्साह नव्या पिढीचा…",
      dateLabel: "July 17th & 18th, 2026",
      eventDate: new Date("2026-07-17T12:00:00.000Z"),
      location: "Leesburg",
      isActive: true,
      ...MKM_EVENT_COLORS,
      logoUrl: "/mkm-logo.png",
      enabledFrameThemes: JSON.stringify([
        "gauravshali-sohla",
        "traditional-maharashtrian",
        "elegant-gold",
      ]),
      eventHighlights: JSON.stringify(MKM_EVENT_HIGHLIGHTS),
      posterTemplate: JSON.stringify(MKM_POSTER_TEMPLATE),
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
      update: option,
      create: { eventId: event.id, ...option },
    });
  }

  console.log("Seeded event:", event.slug);
  console.log("Admin:", process.env.ADMIN_EMAIL || "admin@example.com");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
