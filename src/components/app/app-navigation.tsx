"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export const APP_LINKS = [
  { href: "/app/dashboard", label: "Overview", mobileLabel: "Overview", icon: "overview" },
  { href: "/app/measurements/new", label: "Add Health Information", mobileLabel: "Add Health", icon: "entry" },
  { href: "/app/measurements/history", label: "Past measurements", mobileLabel: "History", icon: "history" },
  { href: "/app/trends", label: "Changes over time" },
  { href: "/app/risk-summary", label: "Health risk summary", mobileLabel: "Risk Summary", icon: "summary" },
  { href: "/app/education", label: "Health guides" },
] as const;

const MOBILE_LINKS = APP_LINKS.filter((link) => "mobileLabel" in link);
const MORE_LINKS = APP_LINKS.filter((link) => !("mobileLabel" in link));
const MORE_ID = "app-mobile-more";

const ICON_PATHS = {
  overview: "m3 10 9-7 9 7v10H3z M9 20v-7h6v7",
  entry: "M8 4H5v16h14V4h-3 M9 3h6v4H9z M9 12h6 M9 16h4",
  history: "M4 11a8 8 0 1 1 1 6 M4 6v5h5 M12 8v4l3 2",
  summary: "M12 3 5 6v5c0 4 2.5 7 7 10 4.5-3 7-6 7-10V6z M9 11h6 M9 14h4",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
} as const;

function NavIcon({ name }: Readonly<{ name: keyof typeof ICON_PATHS }>) {
  return (
    <svg aria-hidden="true" fill="none" focusable="false" viewBox="0 0 24 24">
      <path
        d={ICON_PATHS[name]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={name === "more" ? 3 : 1.75}
      />
    </svg>
  );
}

export function AppNavigation() {
  const pathname = usePathname()?.replace(/\/$/, "");
  const links = APP_LINKS.map((link) => {
    const isCurrent = link.href === pathname;

    return (
      <Link
        aria-current={isCurrent ? "page" : undefined}
        className={isCurrent ? "is-current" : undefined}
        href={link.href}
        key={link.href}
      >
        {link.label}
      </Link>
    );
  });

  return (
    <nav aria-label="Application navigation" className="app-navigation">
      <p className="eyebrow app-navigation__label">Health journal</p>
      <div className="app-nav app-nav--desktop">{links}</div>
    </nav>
  );
}

export function AppMobileNavigation() {
  const pathname = usePathname()?.replace(/\/$/, "");
  const currentMoreLink = MORE_LINKS.find((link) => link.href === pathname);
  const morePanel = useRef<HTMLElement>(null);

  return (
    <nav aria-label="Mobile application navigation" className="app-mobile-nav">
      <div className="app-mobile-nav__items">
        {MOBILE_LINKS.map((link) => (
          <Link aria-current={link.href === pathname ? "page" : undefined} href={link.href} key={link.href}>
            <NavIcon name={link.icon} />
            <span>{link.mobileLabel}</span>
          </Link>
        ))}
        <button
          aria-controls={MORE_ID}
          aria-describedby={currentMoreLink ? "app-mobile-more-current" : undefined}
          className={currentMoreLink ? "is-current" : undefined}
          popoverTarget={MORE_ID}
          type="button"
        >
          <NavIcon name="more" />
          <span>More</span>
        </button>
      </div>
      {currentMoreLink ? <span hidden id="app-mobile-more-current">Current section: {currentMoreLink.label}</span> : null}
      <section
        aria-labelledby="app-mobile-more-heading"
        className="app-mobile-nav__more"
        id={MORE_ID}
        key={pathname}
        popover="auto"
        ref={morePanel}
      >
        <div className="app-mobile-nav__more-heading">
          <h2 id="app-mobile-more-heading">More</h2>
          <button aria-label="Close more navigation" popoverTarget={MORE_ID} popoverTargetAction="hide" type="button">
            Close
          </button>
        </div>
        {MORE_LINKS.map((link) => (
          <Link
            aria-current={link.href === pathname ? "page" : undefined}
            href={link.href}
            key={link.href}
            onNavigate={() => morePanel.current?.hidePopover()}
          >
            {link.label}
          </Link>
        ))}
      </section>
    </nav>
  );
}
