import { Link } from "@/i18n/navigation";

type Props<S extends string> = {
  href: string;
  current: S | undefined;
  statuses: readonly S[];
  label: (status: S) => string;
  allLabel: string;
  ariaLabel: string;
};

/** Status filter as links to ?status=…; the current one carries aria-current. */
export function StatusTabs<S extends string>({ href, current, statuses, label, allLabel, ariaLabel }: Props<S>) {
  return (
    <nav className="tabs" aria-label={ariaLabel}>
      <Link href={href} className="tab" aria-current={current === undefined ? "page" : undefined}>{allLabel}</Link>
      {statuses.map((status) => (
        <Link key={status} href={{ pathname: href, query: { status } }} className="tab" aria-current={current === status ? "page" : undefined}>
          {label(status)}
        </Link>
      ))}
    </nav>
  );
}
