"use client";

export default function AdvisorNav() {
  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <a
            href="/advisor"
            className="text-sm font-semibold text-slate-900"
          >
            Advisor
          </a>

          <a
            href="/advisor/create-project"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Create project
          </a>

          <a
            href="/advisor/projects"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Projects
          </a>
        </div>
      </div>
    </div>
  );
}