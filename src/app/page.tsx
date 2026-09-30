import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your attendees become your promoters",
  description:
    "RSVPShare gives every guest a poster they share on social media and messaging apps with their friends, and people they know who already trust them. Event organizers grow attendance while spending less on marketing.",
};

const ATTENDEE_BASELINE = 5000;
const EVENT_BASELINE = 10;

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const benefits = [
  {
    title: "Your attendees become your promoters",
    body: "A guest puts their name and photo on your event poster, then shares it on WhatsApp, Instagram, and Facebook. The invitation travels with someone their friends already know. Eventbrite’s social commerce research describes the same shift: attendees become promoters, and sharing through a social graph is virtually free.",
  },
  {
    title: "Spend less — or nothing — on the next campaign",
    body: "A personal poster reaches a friend’s circle. You can keep a small budget for the channels that still matter, and let the people who are already coming carry the rest of the invitation.",
  },
  {
    title: "A recommendation outperforms an ad",
    body: "Nielsen’s 2021 Trust in Advertising study found that 88% of people worldwide trust a recommendation from someone they know more than any other channel. The same study found that 50% more people trust those recommendations than online banner ads, mobile ads, text messages, and search ads.",
  },
];

const sources = [
  {
    stat: "88%",
    label: "trust a recommendation from someone they know more than any other channel",
    source: "Nielsen, Trust in Advertising",
    detail:
      "In a global survey of more than 40,000 people, word of mouth was the most trusted channel. Nielsen also reported that trust in advertising is lower in North America and Europe than in other regions, which makes a friend’s invitation more valuable than another ad placement.",
    href: "https://www.nielsen.com/insights/2021/beyond-martech-building-trust-with-consumers-and-engaging-where-sentiment-is-high/",
  },
  {
    stat: "20%",
    label: "more ticket sales per share after someone has committed to attend",
    source: "Eventbrite, Social Commerce",
    detail:
      "A Facebook share made after purchase drove 20% more ticket sales per share than a share made while someone was still browsing. Ten percent of buyers shared from the confirmation page. One percent of browsers shared from the event page. Eventbrite’s conclusion: effective promotion is no longer reserved for organizers who can afford expensive media buys, because sharing on a social graph is virtually free.",
    href: "https://www.eventbrite.com/blog/press/press-releases/eventbrite-unveils-industry-first-data-to-quantify-the-value-of-social-commerce/",
  },
];

export default async function HomePage() {
  const [submissionCount, eventCount] = await Promise.all([
    prisma.submission.count(),
    prisma.event.count(),
  ]);

  const attendees = ATTENDEE_BASELINE + submissionCount;
  const eventsUsed = EVENT_BASELINE + eventCount;

  return (
    <div className="min-h-screen bg-brand-cream text-gray-900">
      <header className="border-b border-brand-cream-dark bg-brand-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-brand-teal">
            RSVPShare
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#research" className="text-brand-teal hover:underline">
              Research
            </a>
            <Link
              href="/admin"
              className="rounded-full bg-brand-teal px-4 py-2 font-semibold text-brand-gold hover:bg-brand-teal-dark"
            >
              Organizer sign-in
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-24">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
            For event organizers
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-brand-teal md:text-6xl">
            Your attendees become your promoters
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-700">
            RSVPShare will create custom posters for your event. Every guest
            puts their name and photo on a poster made for the occasion, then
            shares it on social media and messaging apps with their friends,
            and people they know who already trust them. Your next event gets
            seen, and the marketing bill stays smaller.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-700">
            RSVPShare is free for non-profit organizations and for events with
            fewer than 50 attendees.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/setup"
              className="rounded-full bg-brand-teal px-6 py-3 font-semibold text-brand-gold hover:bg-brand-teal-dark"
            >
              Set up your event
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="text-3xl font-bold text-brand-teal">
            Want to try out RSVPShare?
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-700">
            Click the Try Out event below and create your poster.
          </p>
          <Link
            href="/event/try-out"
            className="mt-6 block max-w-md rounded-2xl bg-white px-6 py-5 shadow-sm transition hover:shadow-md"
          >
            <span className="font-semibold text-brand-teal">Try Out</span>
            <span className="mt-1 block text-sm text-gray-500">
              Create a sample poster
            </span>
          </Link>
        </section>

        <section className="bg-brand-teal text-brand-cream">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2">
            <div>
              <p className="text-4xl font-bold text-brand-gold md:text-5xl">
                {formatCount(attendees)}
              </p>
              <p className="mt-2 text-lg">attendees have used RSVPShare</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-brand-gold md:text-5xl">
                {formatCount(eventsUsed)}
              </p>
              <p className="mt-2 text-lg">events have used RSVPShare</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold text-brand-teal">
            Why organizers use it
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-brand-teal">
                  {benefit.title}
                </h3>
                <p className="mt-3 leading-relaxed text-gray-700">
                  {benefit.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="research" className="border-y border-brand-cream-dark bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-3xl font-bold text-brand-teal">
              What published research says
            </h2>
            <p className="mt-4 max-w-2xl text-gray-700">
              Platforms that turn guests into sharers show up in independent
              research on trust and ticket sales. These are the figures behind
              the product.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {sources.map((item) => (
                <article
                  key={item.href}
                  className="rounded-2xl border border-brand-cream-dark p-6"
                >
                  <p className="text-5xl font-bold text-brand-gold">{item.stat}</p>
                  <p className="mt-3 text-lg font-medium text-brand-teal">
                    {item.label}
                  </p>
                  <p className="mt-4 leading-relaxed text-gray-700">{item.detail}</p>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-block text-sm font-semibold text-brand-teal underline"
                  >
                    {item.source}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold text-brand-teal">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Publish the event",
                body: "Add the name, date, place, and the frames your guests will use.",
              },
              {
                step: "02",
                title: "Guests make a poster",
                body: "Each person adds their photo and name. The poster is theirs to keep.",
              },
              {
                step: "03",
                title: "They share it",
                body: "Friends see the event from someone they know, on the apps they already open.",
              },
            ].map((item) => (
              <li key={item.step} className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-bold tracking-widest text-brand-gold">
                  {item.step}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-brand-teal">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-gray-700">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-brand-teal">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="max-w-xl text-3xl font-bold text-brand-cream">
              Market the next event with the people who are already coming.
            </h2>
            <Link
              href="/setup"
              className="mt-8 inline-block rounded-full bg-brand-gold px-6 py-3 font-semibold text-brand-teal hover:bg-brand-gold-light"
            >
              Set up your event
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-sm text-gray-500">
        <p>RSVPShare · Posters your guests share for you</p>
      </footer>
    </div>
  );
}
