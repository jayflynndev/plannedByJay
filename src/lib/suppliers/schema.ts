import { z } from "zod";

export const supplierFields = {
  website: "Official website",
  legal_name: "Legal company / trading name",
  business_address: "Public business address",
  contact_email: "Public contact email",
  contact_url: "Public contact-page URL",
  atol_holder: "ATOL holder",
  atol_number: "ATOL number",
  booking_conditions_url: "Booking conditions URL",
  specialism: "Supplier specialism",
} as const;
export type SupplierField = keyof typeof supplierFields;
export const specialisms = ["Package Holidays", "Cruises", "Accommodation", "Tours", "Attractions", "Transfers", "Car Hire"];
export const webUrl = z.string().trim().max(2000).refine(value => {
  if (!value) return true;
  try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password; }
  catch { return false; }
}, "Enter a complete http:// or https:// web address.");
export const sourceSchema = z.object({
  url: webUrl.refine(Boolean, "A source URL is required."),
  kind: z.enum(["official", "suggested"]),
  value: z.string().max(2000),
}).strict();
export const supplierInput = z.object({
  id: z.uuid().nullable().default(null),
  version: z.number().int().nonnegative().default(0),
  name: z.string().trim().min(1, "Enter a supplier name.").max(120).transform(s => s.replace(/\s+/g, " ")),
  website: webUrl.default(""),
  legal_name: z.string().trim().max(200).default(""),
  business_address: z.string().trim().max(1000).default(""),
  contact_email: z.union([z.literal(""), z.email().max(320)]).default(""),
  contact_url: webUrl.default(""),
  atol_holder: z.string().trim().max(200).default(""),
  atol_number: z.string().trim().regex(/^\d{0,10}$/, "Use the ATOL number only, without letters.").default(""),
  booking_conditions_url: webUrl.default(""),
  specialism: z.string().trim().max(80).default(""),
  status: z.enum(["draft", "approved"]).default("draft"),
  sources: z.object(Object.fromEntries(Object.keys(supplierFields).map(k => [k, sourceSchema.optional()])) as Record<SupplierField, z.ZodOptional<typeof sourceSchema>>).strict().default({}),
}).strict();
export type SupplierInput = z.output<typeof supplierInput>;
export type Supplier = SupplierInput & {id: string; archived: boolean; created_at: string; updated_at: string};
export const emptySupplier = (): SupplierInput => ({...supplierInput.parse({name: "_"}), name: ""});
export const sourceLabel = (kind: "official" | "suggested") => kind === "official" ? "Found on official supplier website" : "Suggested but needs checking";
