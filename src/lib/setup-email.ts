const SETUP_INBOX = "rahul98@gmail.com";

export function setupInboxAddress() {
  return SETUP_INBOX;
}

export function setupFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "RSVPShare <onboarding@resend.dev>"
  );
}
