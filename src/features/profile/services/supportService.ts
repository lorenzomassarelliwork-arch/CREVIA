export type SupportRequest = {
  email: string;
  message: string;
  subject: string;
};

export async function sendSupportRequest(
  _request: SupportRequest
): Promise<{ ticketId: string | null; error: string | null }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { ticketId: `CRV-${Date.now().toString().slice(-6)}`, error: null };
}
