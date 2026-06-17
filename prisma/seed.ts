import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
      name: "MKM 51st Gauravshali Sohla",
      tagline: "सोहळा कौतुकाचा, सन्मान ज्येष्ठांचा, उत्साह नव्या पिढीचा…",
      dateLabel: "July 17th & 18th, 2026",
      location: "Washington DC",
      subtitle: "#MKM51",
      isActive: true,
      logoUrl: "/mkm-logo.png",
      backgroundColor: "#ffffff",
      primaryColor: "#1e3a6e",
      accentColor: "#e85d24",
      posterTemplate: JSON.stringify({
        hashtag: "#MKM51",
        headline: [
          { text: "JOIN ME AT THE", color: "accent" },
          { text: "MKM 51st", color: "primary" },
          { text: "GAURAVSHALI SOHLA", color: "gold" },
        ],
        website: "rsvpshare.com",
        socialHandle: "/MKMCommunity",
      }),
    },
    create: {
      slug: "mkm-51st-gauravshali-sohla",
      name: "MKM 51st Gauravshali Sohla",
      subtitle: "#MKM51",
      tagline: "सोहळा कौतुकाचा, सन्मान ज्येष्ठांचा, उत्साह नव्या पिढीचा…",
      dateLabel: "July 17th & 18th, 2026",
      location: "Washington DC",
      isActive: true,
      primaryColor: "#1e3a6e",
      accentColor: "#e85d24",
      backgroundColor: "#ffffff",
      logoUrl: "/mkm-logo.png",
      posterTemplate: JSON.stringify({
        hashtag: "#MKM51",
        headline: [
          { text: "JOIN ME AT THE", color: "accent" },
          { text: "MKM 51st", color: "primary" },
          { text: "GAURAVSHALI SOHLA", color: "gold" },
        ],
        website: "rsvpshare.com",
        socialHandle: "/MKMCommunity",
      }),
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
