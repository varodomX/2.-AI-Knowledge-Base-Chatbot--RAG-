import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Folio — Your documents, in conversation",
  description:
    "A source-grounded AI workspace. Upload PDFs, search your knowledge, and get answers with page citations.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
