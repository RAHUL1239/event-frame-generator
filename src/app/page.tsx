import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your attendees become your promoters",
  description:
    "RSVPShare gives every guest a poster they share on social media and messaging apps with their friends, and people they know who already trust them. Event organizers grow attendance while spending less on marketing.",
};

const DISPLAY_ATTENDEES = 50972;
const DISPLAY_EVENTS = 132;

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

const examples = [
  {
    src: "/examples/nextwave-innovation-summit.png",
    event: "NextWave Innovation Summit",
    guest: "Maya Johnson",
    caption: "Conference",
  },
  {
    src: "/examples/one-world-community-festival.png",
    event: "One World Community Festival",
    guest: "Sofia & Miguel Rivera",
    caption: "Community festival",
  },
  {
    src: "/examples/alumni-reunion.png",
    event: "Class of 2017 Alumni Reunion",
    guest: "Daniel Chen",
    caption: "Alumni reunion",
  },
  {
    src: "/examples/brighter-tomorrows-gala.png",
    event: "Brighter Tomorrows Gala",
    guest: "Priya Shah",
    caption: "Fundraiser",
  },
];

const benefits = [
  {
    title: "Your attendees become your promoters",
    body: "A guest puts their name and photo on your event poster, then shares it on WhatsApp, Instagram, and Facebook. The invitation travels with someone their friends already know. Eventbrite’s social commerce research describes the same shift: attendees become promoters, and sharing through a social graph is virtually free.",
    icon: "people",
  },
  {
    title: "Spend less — or nothing — on the next campaign",
    body: "A personal poster reaches a friend’s circle. You can keep a small budget for the channels that still matter, and let the people who are already coming carry the rest of the invitation.",
    icon: "chart",
  },
  {
    title: "A recommendation outperforms an ad",
    body: "Nielsen’s 2021 Trust in Advertising study found that 88% of people worldwide trust a recommendation from someone they know more than any other channel. The same study found that 50% more people trust those recommendations than online banner ads, mobile ads, text messages, and search ads.",
    icon: "heart",
  },
];

const steps = [
  {
    step: "01",
    title: "Publish the event",
    body: "Add the name, date, place, and the frames your guests will use.",
    icon: "publish",
  },
  {
    step: "02",
    title: "Guests make a poster",
    body: "Each person adds their photo and name. The poster is theirs to keep.",
    icon: "poster",
  },
  {
    step: "03",
    title: "They share it",
    body: "Friends see the event from someone they know, on the apps they already open.",
    icon: "share",
  },
];

const sources = [
  {
    stat: "88%",
    label:
      "trust a recommendation from someone they know more than any other channel",
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

function LogoMark() {
  return (
    <span className="relative flex h-8 w-8 items-center justify-center">
      <span className="absolute h-3 w-3 rotate-45 rounded-[3px] bg-brand-purple" />
      <span className="absolute -top-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 rounded-[2px] bg-cyan-400" />
      <span className="absolute -right-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-brand-gold" />
      <span className="absolute -bottom-0.5 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 rounded-[2px] bg-rose-400" />
      <span className="absolute -left-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-emerald-400" />
    </span>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="8.5" r="2.4" />
      <path d="M15.2 19a4.4 4.4 0 0 1 5.3-3.7" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-7" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 20s-7-4.4-7-9.2A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7 3.8C19 15.6 12 20 12 20z" />
    </svg>
  );
}

function IconPublish() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function IconPoster() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="10" cy="10" r="2.2" />
      <path d="M6.5 17.5 10 14l2.2 2.2L16.5 12 20 15.5" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12 20 5l-6 14-2.4-6.2L4 12z" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M3 13h18M12 8v13" />
      <path d="M12 8c0-3-2.2-4.5-4-3.2S6.5 9 12 8c0-3 2.2-4.5 4-3.2S17.5 9 12 8z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </svg>
  );
}

function benefitIcon(name: string) {
  if (name === "chart") return <IconChart />;
  if (name === "heart") return <IconHeart />;
  return <IconPeople />;
}

function stepIcon(name: string) {
  if (name === "poster") return <IconPoster />;
  if (name === "share") return <IconShare />;
  return <IconPublish />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-violet-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-brand-purple">
            <LogoMark />
            <span className="text-lg">RSVPShare</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 lg:flex">
            <a href="#how-it-works" className="hover:text-brand-purple">
              How it works
            </a>
            <a href="#examples" className="hover:text-brand-purple">
              Examples
            </a>
            <a href="#research" className="hover:text-brand-purple">
              Research
            </a>
            <Link href="/pricing" className="hover:text-brand-purple">
              Pricing
            </Link>
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-brand-purple">
              Organizer sign-in
            </Link>
            <Link
              href="/setup"
              className="rounded-full bg-brand-purple px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-purple-dark"
            >
              Set up your event
            </Link>
          </div>

          <details className="relative lg:hidden">
            <summary className="cursor-pointer list-none rounded-full border border-violet-200 px-3 py-1.5 text-sm font-semibold text-brand-purple">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-violet-100 bg-white p-3 shadow-xl">
              <a href="#how-it-works" className="block rounded-lg px-3 py-2 text-sm hover:bg-brand-purple-soft">
                How it works
              </a>
              <a href="#examples" className="block rounded-lg px-3 py-2 text-sm hover:bg-brand-purple-soft">
                Examples
              </a>
              <a href="#research" className="block rounded-lg px-3 py-2 text-sm hover:bg-brand-purple-soft">
                Research
              </a>
              <Link href="/pricing" className="block rounded-lg px-3 py-2 text-sm hover:bg-brand-purple-soft">
                Pricing
              </Link>
              <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm hover:bg-brand-purple-soft">
                Organizer sign-in
              </Link>
              <Link
                href="/setup"
                className="mt-1 block rounded-full bg-brand-purple px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Set up your event
              </Link>
            </div>
          </details>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-violet-200/50 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-cyan-100/60 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:pb-6 lg:pt-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-purple">
                For event organizers
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-purple sm:text-5xl lg:text-6xl">
                Your attendees become your promoters
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
                RSVPShare creates custom frames for your event. Guests add their
                name and photo and create their event posters. They share their
                posters on social media and messaging apps. Your event reaches
                people who know and trust them. You reach more people and spend
                less on marketing.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/setup"
                  className="rounded-full bg-brand-purple px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:bg-brand-purple-dark"
                >
                  Set up your event
                </Link>
                <Link
                  href="/event/try-out"
                  className="rounded-full border-2 border-brand-purple px-6 py-3 text-sm font-semibold text-brand-purple hover:bg-brand-purple-soft"
                >
                  Try a sample
                </Link>
              </div>
              <p className="mt-5 flex max-w-md items-start gap-2 text-sm text-gray-500">
                <span className="mt-0.5 text-brand-gold">
                  <IconGift />
                </span>
                RSVPShare is free for non-profit organizations and for events
                with fewer than 50 attendees.
              </p>
              <p className="mt-3 max-w-md text-sm text-gray-500">
                RSVPShare does not store any pictures or posters on the system.
              </p>
            </div>

            <div className="relative mx-auto h-[360px] w-full max-w-[520px] sm:h-[420px] lg:h-[460px]">
              <div className="absolute left-0 top-16 w-[46%] -rotate-6 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                <Image
                  src="/examples/nextwave-innovation-summit.png"
                  alt="Sample NextWave Innovation Summit poster"
                  width={800}
                  height={800}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <div className="absolute right-0 top-10 w-[46%] rotate-[8deg] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
                <Image
                  src="/examples/alumni-reunion.png"
                  alt="Sample Class of 2017 Alumni Reunion poster"
                  width={800}
                  height={800}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <div className="absolute left-1/2 top-0 z-10 w-[54%] -translate-x-1/2 rotate-2 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                <Image
                  src="/examples/one-world-community-festival.png"
                  alt="Sample One World Community Festival poster"
                  width={800}
                  height={800}
                  className="h-auto w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-violet-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:px-6">
            <div className="flex items-center justify-center gap-4 text-center sm:justify-start sm:text-left">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple-soft text-brand-purple">
                <IconPeople />
              </span>
              <div>
                <p className="text-4xl font-extrabold text-gray-900">
                  {formatCount(DISPLAY_ATTENDEES)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  attendees have used RSVPShare
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-center sm:justify-start sm:text-left">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple-soft text-brand-purple">
                <IconCalendar />
              </span>
              <div>
                <p className="text-4xl font-extrabold text-gray-900">
                  {formatCount(DISPLAY_EVENTS)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  events have used RSVPShare
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 md:text-4xl">
            Why organizers use it
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple-soft text-brand-purple">
                  {benefitIcon(benefit.icon)}
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {benefit.body}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-gray-500">
            Guests share on the apps they already use — WhatsApp, Instagram, and
            Facebook.
          </p>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
            <h2 className="text-center text-3xl font-extrabold text-gray-900 md:text-4xl">
              One event. Three simple steps.
            </h2>
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {steps.map((item) => (
                <li key={item.step} className="text-center">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-purple shadow-sm ring-1 ring-violet-100">
                    {stepIcon(item.icon)}
                    <span className="absolute -right-2 -top-2 rounded-full bg-brand-gold px-1.5 text-[10px] font-bold text-white">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="examples" className="scroll-mt-24">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
            <h2 className="text-center text-3xl font-extrabold text-gray-900 md:text-4xl">
              Make every invitation personal
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {examples.map((example) => (
                <figure key={example.src} className="text-center">
                  <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
                    <Image
                      src={example.src}
                      alt={`${example.event} sample poster for ${example.guest}`}
                      width={800}
                      height={800}
                      className="h-auto w-full"
                    />
                  </div>
                  <figcaption className="mt-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {example.event}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {example.guest} · {example.caption}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-gray-500">
              Want to try out RSVPShare?{" "}
              <Link
                href="/event/try-out"
                className="font-semibold text-brand-purple underline hover:text-brand-purple-dark"
              >
                Create a sample poster
              </Link>
              .
            </p>
          </div>
        </section>

        <section id="research" className="scroll-mt-24 border-y border-violet-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 lg:px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-brand-purple">
              Published research
            </p>
            <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900 md:text-4xl">
              The power of a personal recommendation
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
              Platforms that turn guests into sharers show up in independent
              research on trust and ticket sales. These are the figures behind
              the product.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {sources.map((item) => (
                <article key={item.href} className="text-center md:text-left">
                  <p className="text-6xl font-extrabold text-brand-purple">
                    {item.stat}
                  </p>
                  <p className="mt-3 text-lg font-medium text-gray-900">
                    {item.label}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600">
                    {item.detail}
                  </p>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-block text-sm font-semibold text-brand-purple underline hover:text-brand-purple-dark"
                  >
                    {item.source}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-16 text-center md:flex-row md:text-left lg:px-6">
            <div className="flex items-start gap-4">
              <span className="mt-1 hidden text-brand-purple md:block">
                <IconShare />
              </span>
              <h2 className="max-w-xl text-2xl font-extrabold text-gray-900 md:text-3xl">
                Market the next event with the people who are already coming.
              </h2>
            </div>
            <Link
              href="/setup"
              className="shrink-0 rounded-full bg-brand-purple px-6 py-3 font-semibold text-white hover:bg-brand-purple-dark"
            >
              Set up your event
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-violet-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row lg:px-6">
          <div>
            <p className="font-semibold text-gray-700">RSVPShare</p>
            <p className="mt-1">Posters your guests share for you</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5">
            <a href="#research" className="hover:text-brand-purple">
              Research
            </a>
            <Link href="/pricing" className="hover:text-brand-purple">
              Pricing
            </Link>
            <Link href="/admin" className="hover:text-brand-purple">
              Organizer sign-in
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
