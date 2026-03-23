export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
import { notFound } from "next/navigation";
import ClientDiagnosticQuestionnaire from "@/app/components/client-diagnostic/ClientDiagnosticQuestionnaire";
import {
  questionnaireTypes,
  type QuestionnaireType,
} from "@/lib/client-diagnostic/question-bank";

export const runtime = "edge";

type PageProps = {
  params: Promise<{
    questionnaireType: string;
  }>;
};

function isQuestionnaireType(value: string): value is QuestionnaireType {
  return questionnaireTypes.includes(value as QuestionnaireType);
}

function getQuestionnaireTitle(questionnaireType: QuestionnaireType): string {
  switch (questionnaireType) {
    case "hr":
      return "HR Team Diagnostic";
    case "manager":
      return "Manager Diagnostic";
    case "leadership":
      return "Leadership Diagnostic";
    case "client_fact_pack":
      return "Client Fact Pack";
    default:
      return "Client Diagnostic";
  }
}

function getQuestionnaireIntro(questionnaireType: QuestionnaireType): string {
  switch (questionnaireType) {
    case "hr":
      return "Please answer based on how HR operations work today in practice, rather than how they are intended to work on paper.";
    case "manager":
      return "Please answer based on your day-to-day experience of navigating people processes, support, and guidance as a manager.";
    case "leadership":
      return "Please answer from your perspective on how effectively people operations support organisational execution, consistency, and scale.";
    case "client_fact_pack":
      return "Please answer from an organisational perspective, using the best available context on structure, operating model, systems, and current ways of working.";
    default:
      return "Please answer based on your direct experience and current understanding of how people operations work today.";
  }
}

export default async function ClientDiagnosticQuestionnairePage({
  params,
}: PageProps) {
  const { questionnaireType } = await params;

  if (!isQuestionnaireType(questionnaireType)) {
    notFound();
  }

  return (
    <main className="brand-light-section min-h-screen">
      <section className="brand-hero">
        <div className="brand-container brand-section brand-hero-content">
          <div className="max-w-4xl">
            <p className="brand-kicker">Client diagnostic</p>

            <h1 className="brand-heading-lg mt-5 text-white">
              {getQuestionnaireTitle(questionnaireType)}
            </h1>

            <p className="brand-subheading brand-body-on-dark mt-6 max-w-3xl">
              This diagnostic is designed to build a rounded view of how people
              operations are working today across different roles and
              perspectives.
            </p>

            <div className="brand-card-dark mt-8 max-w-3xl p-6 sm:p-7">
             <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8AAAC8]">
                  Guidance
                </p>

                <p className="text-base leading-7 text-slate-200">
                  {getQuestionnaireIntro(questionnaireType)}
                </p>

                <p className="text-base leading-7 text-slate-300">
                  Please answer candidly and based on current experience. The
                  most useful insight comes from reflecting how work operates in
                  reality, including where processes feel clear, well supported,
                  inconsistent, or difficult to navigate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClientDiagnosticQuestionnaire questionnaireType={questionnaireType} />
    </main>
  );
}