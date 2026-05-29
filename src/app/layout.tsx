import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Do It Analytics",
  description: "Analytics dashboard for Do It app — internal use only",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
