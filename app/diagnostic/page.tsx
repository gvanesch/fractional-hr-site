export default function Diagnostic() {

  const questions = [
    "Managers handle HR issues inconsistently across teams",
    "Employees are unsure where to go for HR support",
    "HR processes are poorly documented",
    "Onboarding varies significantly between teams",
    "HR systems do not reflect real workflows",
    "HR spends most of its time reacting",
    "The same HR questions repeatedly arise",
    "HR processes struggle during growth",
  ];

  return (
    <main className="bg-[#F4F6FA] py-20">
      <div className="mx-auto max-w-3xl px-6">

        <h1 className="text-4xl font-bold text-[#0A1628] mb-8">
          HR Operations Health Check
        </h1>

        <p className="text-slate-600 mb-10">
          Many organisations experience operational HR friction as they grow.
          This quick diagnostic highlights common signals that HR processes may
          need redesign.
        </p>

        <div className="space-y-6">

          {questions.map((q, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-slate-700">{q}</p>
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}