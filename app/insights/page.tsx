import Link from "next/link";

export default function Insights() {
  return (
    <main className="bg-[#F4F6FA] py-20">
      <div className="mx-auto max-w-5xl px-6">

        <h1 className="text-4xl font-bold text-[#0A1628] mb-6">
          HR Operations Insights
        </h1>

        <p className="text-lg text-slate-600 mb-12">
          Articles exploring HR service delivery, operational design, and how HR
          infrastructure needs to evolve as organisations grow.
        </p>

        <div className="space-y-8">

          <Link href="/insights/why-hr-operations-break-as-companies-grow">
            <div className="rounded-xl bg-white p-8 shadow-sm hover:shadow-md transition">
              <h2 className="text-2xl font-semibold mb-3 text-[#0A1628]">
                Why HR Operations Break As Companies Grow
              </h2>

              <p className="text-slate-600">
                Many organisations reach a point where HR starts feeling reactive,
                inconsistent, and difficult to manage. This article explores why
                operational HR structures often fail during growth.
              </p>
            </div>
          </Link>

        </div>

      </div>
    </main>
  );
}