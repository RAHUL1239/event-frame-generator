import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "One event. One price. RSVPShare is a one-time fee per event. Guests create and share personalized posters at no charge.",
};

const plans = [
  {
    name: "Self-service",
    price: "$99",
    priceNote: "one-time per event",
    summary: "You supply the poster design. We give guests a page they can use.",
    featured: false,
    features: [
      "You send the poster design",
      "Public event link",
      "Photo and name on each poster",
      "Sharing tools for social apps and messaging",
    ],
  },
  {
    name: "We set it up",
    price: "$199",
    priceNote: "one-time per event",
    summary: "We design one poster, set up the event, and send launch instructions.",
    featured: true,
    features: [
      "One custom poster",
      "Event setup",
      "Launch instructions",
      "Two design revisions",
      "Public event link, personalization, and sharing tools",
    ],
  },
  {
    name: "Large or sponsored",
    price: "From $399",
    priceNote: "quoted from the work",
    summary: "For events that need more than one design or sponsor branding.",
    featured: false,
    features: [
      "Multiple poster designs",
      "Sponsor branding",
      "Extra setup support",
      "Price based on the work involved",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-violet-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-brand-teal">
            RSVPShare
          </Link>
          <nav className="flex items-center gap-6 text-base">
            <Link href="/pricing" className="font-medium text-brand-teal hover:underline">
              Pricing
            </Link>
            <Link href="/#research" className="text-brand-teal hover:underline">
              Research
            </Link>
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
        <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-24">
          <p className="text-base font-semibold uppercase tracking-[0.18em] text-brand-gold">
            For event organizers
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-brand-teal md:text-5xl">
            One event. One price. Let your guests spread the word.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-700 sm:text-xl">
            RSVPShare is a one-time fee per event. Guests create a poster with
            their photo and name, then share it with people they know. There is
            no charge per poster or per share.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            At launch, the $199 setup is the main offer for most organizers.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={
                  plan.featured
                    ? "relative flex flex-col rounded-2xl bg-brand-teal p-6 text-brand-cream shadow-md ring-2 ring-brand-gold lg:scale-[1.03] lg:p-8"
                    : "flex flex-col rounded-2xl bg-white p-6 shadow-sm"
                }
              >
                {plan.featured && (
                  <p className="absolute -top-3 left-6 rounded-full bg-brand-gold px-3 py-1 text-sm font-semibold uppercase tracking-wide text-brand-teal">
                    Main offer
                  </p>
                )}
                <h2
                  className={
                    plan.featured
                      ? "text-2xl font-semibold text-brand-gold"
                      : "text-2xl font-semibold text-brand-teal"
                  }
                >
                  {plan.name}
                </h2>
                <p
                  className={
                    plan.featured
                      ? "mt-4 text-5xl font-bold text-brand-gold"
                      : "mt-4 text-4xl font-bold text-brand-teal"
                  }
                >
                  {plan.price}
                </p>
                <p
                  className={
                    plan.featured
                      ? "mt-1 text-lg leading-relaxed text-brand-cream/80 sm:text-xl"
                      : "mt-1 text-lg leading-relaxed text-gray-500 sm:text-xl"
                  }
                >
                  {plan.priceNote}
                </p>
                <p
                  className={
                    plan.featured
                      ? "mt-4 text-lg leading-relaxed text-brand-cream/90 sm:text-xl"
                      : "mt-4 text-lg leading-relaxed text-gray-700 sm:text-xl"
                  }
                >
                  {plan.summary}
                </p>
                <ul
                  className={
                    plan.featured
                      ? "mt-6 flex-1 space-y-2 text-lg leading-relaxed text-brand-cream/90 sm:text-xl"
                      : "mt-6 flex-1 space-y-2 text-lg leading-relaxed text-gray-700 sm:text-xl"
                  }
                >
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link
                  href="/setup"
                  className={
                    plan.featured
                      ? "mt-8 inline-block rounded-full bg-brand-gold px-6 py-3 text-center font-semibold text-brand-teal hover:bg-brand-gold-light"
                      : "mt-8 inline-block rounded-full bg-brand-teal px-6 py-3 text-center font-semibold text-brand-gold hover:bg-brand-teal-dark"
                  }
                >
                  Contact us to start
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-brand-cream-dark bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-4xl font-bold text-brand-teal">
              How the price works
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-brand-cream-dark p-6">
                <h3 className="text-2xl font-semibold text-brand-teal">
                  One fee covers the event
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-gray-700 sm:text-xl">
                  You pay once for the event. Guests do not pay to make a
                  poster or to share it. We do not charge by the poster or by
                  the share.
                </p>
              </article>
              <article className="rounded-2xl border border-brand-cream-dark p-6">
                <h3 className="text-2xl font-semibold text-brand-teal">
                  Event size helps us quote larger work
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-gray-700 sm:text-xl">
                  Guest count does not add extra price bands. We ask about
                  event size so we can see when a large or sponsored event
                  needs more designs or setup support.
                </p>
              </article>
              <article className="rounded-2xl border border-brand-cream-dark p-6">
                <h3 className="text-2xl font-semibold text-brand-teal">
                  Ninety days, then an extension if you need it
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-gray-700 sm:text-xl">
                  Each event stays available for 90 days. If the date moves or
                  you want the page up longer, we can extend it.
                </p>
              </article>
              <article className="rounded-2xl border border-brand-cream-dark p-6">
                <h3 className="text-2xl font-semibold text-brand-teal">
                  What guests get
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-gray-700 sm:text-xl">
                  A public event link, their photo and name on the poster, and
                  tools to share it on social apps and messaging. That is the
                  product: people they know see the invitation from someone
                  they already trust.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-4xl font-bold text-brand-teal">
              Discounts and later plans
            </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            <li className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-2xl font-bold text-brand-gold">25% off</p>
              <p className="mt-2 font-semibold text-brand-teal">
                Nonprofits and community groups
              </p>
              <p className="mt-3 text-lg leading-relaxed text-gray-700 sm:text-xl">
                Tell us when you write. We apply the discount on the event fee.
              </p>
            </li>
            <li className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-2xl font-bold text-brand-gold">15% off</p>
              <p className="mt-2 font-semibold text-brand-teal">
                Three-event bundle
              </p>
              <p className="mt-3 text-lg leading-relaxed text-gray-700 sm:text-xl">
                Book three events together and save 15% on those event fees.
              </p>
            </li>
            <li className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-2xl font-bold text-brand-gold">Later</p>
              <p className="mt-2 font-semibold text-brand-teal">Annual plans</p>
              <p className="mt-3 text-lg leading-relaxed text-gray-700 sm:text-xl">
                We are not selling annual plans yet. They will come later.
              </p>
            </li>
          </ul>
        </section>

        <section className="bg-brand-teal text-brand-cream">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-4xl font-bold">Try it before you write</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-brand-cream/90 sm:text-xl">
              Open the free preview, add a photo and name, and share a sample
              poster. No setup request required.
            </p>
            <Link
              href="/event/try-out"
              className="mt-8 inline-block rounded-full bg-brand-gold px-6 py-3 font-semibold text-brand-teal hover:bg-brand-gold-light"
            >
              Free preview
            </Link>
          </div>
        </section>

        <section className="bg-brand-teal">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="max-w-xl text-4xl font-bold text-brand-cream">
              Ready to set up an event?
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-brand-cream/85 sm:text-xl">
              Send a few details and we will follow up. Mention nonprofit,
              community, or a three-event bundle if that applies.
            </p>
            <Link
              href="/setup"
              className="mt-8 inline-block rounded-full bg-brand-gold px-6 py-3 font-semibold text-brand-teal hover:bg-brand-gold-light"
            >
              Contact us
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-lg leading-relaxed text-gray-500 sm:text-xl">
        <p>RSVPShare · Posters your guests share for you</p>
      </footer>
    </div>
  );
}
