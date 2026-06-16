import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Frame Generator",
  description: "Profile frame and poster generator for community events",
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
