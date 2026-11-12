const transitions: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["verified", "accepted", "rejected", "needs_revision"],
  verified: ["accepted", "rejected", "needs_revision"],
  accepted: ["checked_in", "rejected"],
  checked_in: ["documents_complete", "rejected"],
  documents_complete: [],
  enrolled: [],
  rejected: [],
  needs_revision: ["submitted", "rejected"]
};

export function canTransition(from: string, to: string): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new Error("Status pendaftaran tidak dapat diubah ke tahap tersebut.");
  }
}
