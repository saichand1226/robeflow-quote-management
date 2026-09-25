export type JobReference = {
  quoteNumber?: string;
  serviceType?: string;
  invoiceNumber?: string;
  depositInvoiceNumber?: string;
  balanceInvoiceNumber?: string;
};

export function jobSequence(quoteNumber = "") {
  const base = quoteNumber.replace(/-R\d+$/i, "");
  return base.match(/(\d+)$/)?.[1] || "";
}

export function suggestedInvoiceNumber(
  job: JobReference,
  phase: "deposit" | "balance" | "full" = "full",
) {
  const sequence = jobSequence(job.quoteNumber);
  if (!sequence) return "";
  if (job.serviceType === "Installation")
    return `I${sequence}${phase === "deposit" ? "D" : "DP"}`;
  if (job.serviceType === "Pick Up") return `S${sequence}`;
  if (job.serviceType === "Freight" || job.serviceType === "Delivery")
    return `D${sequence}`;
  return `I${sequence}`;
}

export function displayedJobNumber(job: JobReference) {
  return (
    job.balanceInvoiceNumber ||
    job.depositInvoiceNumber ||
    job.invoiceNumber ||
    job.quoteNumber ||
    ""
  );
}
