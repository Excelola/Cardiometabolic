import type { Metadata } from "next";
import type { ReactNode } from "react";

import { productConfig } from "@/config/product";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: productConfig.productName,
    template: `%s | ${productConfig.productName}`,
  },
  description:
    "A configurable frontend foundation for cardiometabolic early detection and control.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
