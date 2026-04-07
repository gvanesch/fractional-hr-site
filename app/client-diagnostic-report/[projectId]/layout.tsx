import AdvisorNav from "@/app/components/advisor/AdvisorNav";

export default function ClientDiagnosticReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <AdvisorNav />
      {children}
    </div>
  );
}