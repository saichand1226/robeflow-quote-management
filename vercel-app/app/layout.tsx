import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RobeFlow | Quote & Customer Management",
  description: "A full-stack wardrobe sales and operations workflow created by Saichand Muddasani.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
