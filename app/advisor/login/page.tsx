import AdvisorLoginForm from "./AdvisorLoginForm";
import { redirect } from "next/navigation";
import { isCloudflareAdvisorAuthEnabled } from "@/lib/cloudflare-access";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AdvisorLoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function AdvisorLoginPage({
  searchParams,
}: AdvisorLoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams.next || "/advisor";

  if (isCloudflareAdvisorAuthEnabled()) {
    redirect(nextPath.startsWith("/advisor") ? nextPath : "/advisor");
  }

  const initialError =
    resolvedSearchParams.error === "forbidden"
      ? "Your account is not authorised to access the advisor workspace."
      : "";

  return (
    <main className="brand-light-section flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-6 text-xl font-semibold">Advisor Login</h1>
        <AdvisorLoginForm nextPath={nextPath} initialError={initialError} />
      </div>
    </main>
  );
}
