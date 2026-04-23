import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import FloatingCtaPrompt from "@/app/components/FloatingCtaPrompt";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <FloatingCtaPrompt />
      <Footer />
    </>
  );
}