export const dynamic = "force-dynamic";
import AdvisorNav from "@/app/components/advisor/AdvisorNav";

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdvisorNav />
      {children}
    </div>
  );
}