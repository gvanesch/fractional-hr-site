"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdvisorProjectNavProps = {
  projectId: string;
  projectLabel: string;
  crmSearchTerm?: string | null;
};

type ProjectNavItem = {
  href: string;
  label: string;
  activePrefix?: string;
  title?: string;
};

export default function AdvisorProjectNav({
  projectId,
  projectLabel,
  crmSearchTerm,
}: AdvisorProjectNavProps) {
  const pathname = usePathname();
  const crmHref = crmSearchTerm?.trim()
    ? `/advisor/prospects?q=${encodeURIComponent(crmSearchTerm.trim())}`
    : "/advisor/prospects";

  const items: ProjectNavItem[] = [
    {
      href: `/advisor/project/${projectId}`,
      label: "Workspace",
      activePrefix: `/advisor/project/${projectId}`,
    },
    {
      href: `/advisor/explore/${projectId}`,
      label: "Explorer",
      activePrefix: `/advisor/explore/${projectId}`,
    },
    {
      href: `/advisor/report/${projectId}`,
      label: "Evidence Pack",
      activePrefix: `/advisor/report/${projectId}`,
    },
    {
      href: crmHref,
      label: "Prospect CRM",
      title: crmSearchTerm?.trim()
        ? `Open Prospect CRM filtered to ${crmSearchTerm.trim()}`
        : "Open Prospect CRM",
    },
  ];

  return (
    <div className="w-full border-b border-slate-200 bg-slate-100/80">
      <div className="brand-container flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Project navigation
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
            {projectLabel}
          </p>
        </div>

        <nav
          className="flex flex-wrap items-center gap-2"
          aria-label={`${projectLabel} project navigation`}
        >
          {items.map((item) => {
            const active = item.activePrefix
              ? pathname.startsWith(item.activePrefix)
              : false;

            return (
              <Link
                key={item.label}
                href={item.href}
                title={item.title}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 items-center justify-center rounded-xl px-3.5 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
