import type { ReactNode } from "react";

type MediaFrameProps = Readonly<{
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}>;

export function MediaFrame({ ariaLabel, children, className = "" }: MediaFrameProps) {
  return (
    <aside aria-label={ariaLabel} className={`media-frame ${className}`.trim()}>
      {children}
    </aside>
  );
}
