export const jobCardFieldOptions = [
  { key: "createdAt", label: "Created date" },
  { key: "siteAddress", label: "Site address" },
  { key: "customerName", label: "Customer" },
  { key: "companyName", label: "Company" },
  { key: "email", label: "Customer email" },
  { key: "phone", label: "Phone number" },
  { key: "project", label: "Project" },
  { key: "followUpDate", label: "Follow up" },
  { key: "validUntil", label: "Valid until" },
  { key: "serviceType", label: "Service" },
  { key: "salespersonName", label: "Salesperson" },
  { key: "amount", label: "Sales value incl. GST" },
  { key: "invoiceNumber", label: "Invoice number" },
  { key: "invoiceStatus", label: "Payment status" },
  { key: "jobStage", label: "Job stage" },
  { key: "dispatchStatus", label: "Dispatch status" },
  { key: "pickListStatus", label: "Pick-list status" },
  { key: "trackingNumber", label: "Tracking number" },
] as const;

export type JobCardFieldKey = (typeof jobCardFieldOptions)[number]["key"];

export const defaultJobCardFields: JobCardFieldKey[] = [
  "createdAt",
  "siteAddress",
  "customerName",
  "phone",
  "serviceType",
  "salespersonName",
  "amount",
  "invoiceStatus",
];
