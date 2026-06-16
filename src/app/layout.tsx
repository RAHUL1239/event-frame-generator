import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://rsvpshare.com"),
  title: {
    default: "RSVPShare",
    template: "%s | RSVPShare",
  },
  description:
    "Create and share event profile frames, posters, and WhatsApp DPs for your community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
