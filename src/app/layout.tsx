import type { Metadata } from "next";
import type { ReactNode } from "react";

import { productConfig } from "@/config/product";

import "./globals.css";
import "./editorial-journal.css";

export const metadata: Metadata = {
  title: {
    default: productConfig.productName,
    template: `%s | ${productConfig.productName}`,
  },
  description:
    "HILERA helps people understand health information and review changes over time.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
