import { NextResponse } from "next/server";
import { Resend } from "resend";
import { setupFromAddress, setupInboxAddress } from "@/lib/setup-email";

const MAX_FIELD = 500;
const MAX_MESSAGE = 4000;

function clean(value: unknown, max = MAX_FIELD) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = clean(body.name);
  const email = clean(body.email);
  const phone = clean(body.phone, 40);
  const organization = clean(body.organization);
  const eventName = clean(body.eventName);
  const eventDate = clean(body.eventDate);
  const eventLocation = clean(body.eventLocation);
  const message = clean(body.message, MAX_MESSAGE);

  if (!name || !email || !phone || !organization || !eventName) {
    return NextResponse.json(
      {
        error:
          "Name, email, phone, organization, and event name are required.",
      },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return NextResponse.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Set RESEND_API_KEY on the server so setup requests can be sent.",
      },
      { status: 503 }
    );
  }

  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Organization: ${organization}`,
    `Event name: ${eventName}`,
    `Event date: ${eventDate || "(not provided)"}`,
    `Event location: ${eventLocation || "(not provided)"}`,
    "",
    "Message:",
    message || "(none)",
  ];

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: setupFromAddress(),
      to: setupInboxAddress(),
      replyTo: email,
      subject: `RSVPShare setup request: ${eventName}`,
      text: lines.join("\n"),
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Resend could not send the email." },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "The setup email could not be sent. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
