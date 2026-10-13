import { createHash } from "node:crypto";
// Hashes only. Raw links are issued privately to the organiser, never committed.
export const DESIGN_TEST_EXPIRES = "2026-10-25T23:59:59Z";
const TESTERS: Record<string, string> = {
  "530632b90c911a2744f5f2715057754b9b850a50b7ddbbcc720e0f40084f2f86":
    "Tester 1",
  "0d3f0cad97480bccdd3d361e02524b81ec250e0dfd73bd9065cc8c996dc89fc5":
    "Tester 2",
  "6ab80c8240e5b3c801dd1bdeb1b954e85e5d527d088c44f8d77484adc24031d3":
    "Tester 3",
  "34ab15319c3fcd85a33dc3b359d40fff87067fbdce47acaa088798ef5cf524ef":
    "Tester 4",
  cb22bf7279b50b5b00d0e3688903d7fec84c82f94da4f7e90a08fe10fe209ca4: "Tester 5",
  "93fecb08f5273f689c728cad4d368fa35f6e69b47243c7f6a8f87c6de1ef6ca7":
    "Tester 6",
};
export function designTester(
  token: unknown,
  environment: string | undefined,
  now = Date.now(),
) {
  if (environment !== "qa" || now >= Date.parse(DESIGN_TEST_EXPIRES))
    return null;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return null;
  return TESTERS[createHash("sha256").update(token).digest("hex")] ?? null;
}
export const DESIGN_TESTER_COUNT = Object.keys(TESTERS).length;
