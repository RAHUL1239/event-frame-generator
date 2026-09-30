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
    <div className="min-h-screen bg-brand-cream text-gray-900">
      <header className="border-b border-brand-cream-dark bg-brand-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-brand-teal">
            RSVPShare
          </Link>
          <Link
            href="/admin"
            className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-teal-dark"
          >
            Organizer sign-in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-gold">
          For event organizers
        </p>
        <h1 className="mt-4 text-4xl font-bold text-brand-teal">
          Set up your event
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-700">
          Share a few details and we will help you get a guest poster page
          ready. RSVPShare is free for non-profit organizations and for events
          with fewer than 50 attendees.
        </p>

        <div className="mt-8">
          <SetupContactForm />
        </div>
      </main>
    </div>
  );
}
