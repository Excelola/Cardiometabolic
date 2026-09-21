import Image from "next/image";
import Link from "next/link";

type BrandLockupProps = Readonly<{
  href?: string;
  priority?: boolean;
}>;

export function HileraLogo({ priority = false }: Readonly<{ priority?: boolean }>) {
  return (
    <Image
      alt="HILERA"
      className="hilera-logo"
      height={50}
      priority={priority}
      src="/hilera-lockup.svg"
      width={152}
    />
  );
}

export function BrandLockup({ href = "/", priority = false }: BrandLockupProps) {
  return (
    <Link aria-label="HILERA home" className="brand-lockup" href={href}>
      <HileraLogo priority={priority} />
    </Link>
  );
}
