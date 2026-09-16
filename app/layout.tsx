import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RobeFlow | Quote & Operations Management",
  description: "A full-stack portfolio project connecting quotations, customers, invoices, payments, dispatch and installation.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
