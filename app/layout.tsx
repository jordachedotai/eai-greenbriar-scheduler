import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Greenbriar Portco Meeting Scheduler",
  description: "Quarterly portfolio company meeting scheduling, one board, one button per step.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
