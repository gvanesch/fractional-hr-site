"use client";

type CopyBriefingButtonProps = {
  text: string;
};

export default function CopyBriefingButton({
  text,
}: CopyBriefingButtonProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      window.alert("Briefing copied to clipboard.");
    } catch (error) {
      console.error("Failed to copy briefing.", error);
      window.alert("Failed to copy briefing.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      Copy briefing for LLM
    </button>
  );
}