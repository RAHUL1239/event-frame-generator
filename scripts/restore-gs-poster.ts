import { PrismaClient } from "@prisma/client";
import { MKM_EVENT_COLORS } from "../src/lib/mkm-event-colors";

const prisma = new PrismaClient();

const MKM_POSTER_TEMPLATE_JSON = JSON.stringify({
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
});

/** Restore GS flyer poster template + colors on the MKM event. */
async function main() {
  await prisma.event.update({
    where: { slug: "mkm-51st-gauravshali-sohla" },
    data: {
      ...MKM_EVENT_COLORS,
      name: "MARATHI KALA MANDAL WASHINGTON DC",
      subtitle: "PROFILE FRAME & POSTER GENERATOR",
      posterTemplate: MKM_POSTER_TEMPLATE_JSON,
    },
  });
  console.log("Restored GS poster template for mkm-51st-gauravshali-sohla");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
