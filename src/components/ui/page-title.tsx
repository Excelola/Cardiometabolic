import type { ReactNode } from "react";

type PageTitleProps = Readonly<{
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}>;

export function PageTitle({ children, eyebrow, title }: PageTitleProps) {
  return (
    <header className="page-heading">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1>{title}</h1>
      {children ? <div className="page-heading__intro">{children}</div> : null}
    </header>
  );
}
