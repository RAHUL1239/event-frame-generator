import Link from "next/link";
import type { Metadata } from "next";
import { SetupContactForm } from "@/components/SetupContactForm";

export const metadata: Metadata = {
  title: "Set up your event",
  description:
    "Tell us about your event. RSVPShare is free for non-profit organizations and for events with fewer than 50 attendees.",
};

export default function SetupPage() {
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
            <Link
              href="/admin"
              className="rounded-full bg-brand-teal px-4 py-2 text-base font-semibold text-brand-gold hover:bg-brand-teal-dark"
            >
              Organizer sign-in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-base font-semibold uppercase tracking-[0.18em] text-brand-gold">
          For event organizers
        </p>
        <h1 className="mt-4 text-6xl font-bold text-brand-teal">
          Set up your event
        </h1>
        <p className="mt-4 text-xl leading-relaxed text-gray-700">
          Share a few details and we will help you get a guest poster page
          ready. RSVPShare is free for non-profit organizations and for events
          with fewer than 50 attendees.
        </p>

        <div className="mt-8">
          <SetupContactForm />
        </div>

        <section className="mt-12" aria-labelledby="pricing">
          <h2 id="pricing" className="text-4xl font-bold text-brand-teal">
            Pricing
          </h2>
          <p className="mt-2 text-base leading-relaxed text-gray-700">
            One-time fee per event. Guests create and share posters at no
            charge.
          </p>

          <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full min-w-[28rem] text-left text-base">
              <thead>
                <tr className="border-b border-brand-cream-dark text-brand-teal">
                  <th className="px-5 py-3 font-semibold">Option</th>
                  <th className="px-5 py-3 font-semibold">Public price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-brand-cream-dark align-top">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-brand-teal">
                      Supply your own poster design
                    </p>
                    <p className="mt-1 leading-relaxed text-gray-600">
                      You supply the poster design. RSVPShare provides the
                      public event link, photo and name personalization, and
                      sharing tools for social and messaging apps. Guests use
                      these tools at no charge.
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-brand-teal">
                    $99 per event
                  </td>
                </tr>
                <tr className="border-b border-brand-cream-dark align-top bg-brand-cream/60">
                  <td className="border-l-4 border-brand-gold px-5 py-4">
                    <p className="font-semibold text-brand-teal">
                      We design your poster and set everything up
                    </p>
                    <p className="mt-1 leading-relaxed text-gray-600">
                      We prepare one custom poster, set up the event, and send
                      launch instructions. Two design revisions are included.
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-brand-teal">
                    $199 per event
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-brand-teal">
                      Multiple designs or custom requirements
                    </p>
                    <p className="mt-1 leading-relaxed text-gray-600">
                      Multiple poster designs, sponsor branding, and additional
                      setup support are quoted from the work involved.
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-brand-teal">
                    Contact us
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-base text-gray-600">
            Discounts available for nonprofits and community groups.
          </p>
        </section>
      </main>
    </div>
  );
}
