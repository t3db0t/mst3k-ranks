import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MST3K Top 5 Poll Analyzer",
  description: "Analyze Reddit MST3K Top 5 poll results with Borda scoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
