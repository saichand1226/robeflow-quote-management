export type CustomFieldType = "text" | "number" | "date" | "boolean" | "select";
export type CustomFieldDefinition = {
  id: number;
  fieldKey: string;
  label: string;
  fieldType: CustomFieldType;
  options: string[];
  required: boolean;
  showNewQuote: boolean;
  showDashboard: boolean;
  showJobCard: boolean;
  active: boolean;
  sortOrder: number;
};
export type CustomFieldValue = {
  fieldId: number;
  fieldKey: string;
  label: string;
  fieldType: CustomFieldType;
  value: string;
  options?: string[];
  required?: boolean;
  showNewQuote?: boolean;
  showDashboard?: boolean;
  showJobCard?: boolean;
  active?: boolean;
  sortOrder?: number;
};

export function customFieldValueMap(values?: CustomFieldValue[]) {
  return Object.fromEntries(
    (values ?? []).map((item) => [item.fieldId, item.value]),
  );
}

export function displayCustomValue(value: string, fieldType: CustomFieldType) {
  if (fieldType === "boolean") return value === "true" ? "Yes" : "No";
  if (fieldType === "date" && value)
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-NZ");
  return value || "—";
}
