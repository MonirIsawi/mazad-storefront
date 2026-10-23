import { z } from 'zod';

/** mazad-api SupportReportKind / SupportReportStatus. */
export const reportKindSchema = z.enum(['PROBLEM', 'SUGGESTION', 'OTHER']);
export const reportStatusSchema = z.enum(['RECEIVED', 'IN_REVIEW', 'RESOLVED']);

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

/** POST /support/reports → the reference to quote and the first status. */
export const createdReportSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: reportStatusSchema,
  createdAt: z.string(),
});

/** One of GET /me/support/reports (the admin's note is never sent to the reporter). */
export const myReportSchema = z.object({
  id: z.string(),
  reference: z.string(),
  kind: reportKindSchema,
  status: reportStatusSchema,
  message: z.string(),
  orderId: z.string().nullable(),
  orderNumber: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Cursor pages, newest first; `nextCursor` is null on the last page. */
export const myReportsPageSchema = z.object({
  items: z.array(myReportSchema),
  nextCursor: z.string().nullable(),
});

/**
 * Just what the order picker shows of GET /me/orders and GET /orders/:id: the number, the status
 * and the first item's name and photo. Anything else in the payload is ignored.
 */
const nameSchema = z.object({ nameEn: z.string().nullish(), nameAr: z.string().nullish() });
export const reportOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  items: z
    .array(
      z.object({
        product: nameSchema.nullish(),
        display: nameSchema.extend({ thumbUrl: z.string().nullish() }).nullish(),
      }),
    )
    .default([]),
});
export const reportOrdersSchema = z.array(reportOrderSchema);

/** The form; messages are i18n keys in the support namespace. */
export const reportFormSchema = z.object({
  kind: reportKindSchema,
  orderId: z.string().optional(),
  message: z
    .string()
    .trim()
    .min(MESSAGE_MIN, 'form.errors.messageShort')
    .max(MESSAGE_MAX, 'form.errors.messageLong'),
});

export type ReportKind = z.infer<typeof reportKindSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type CreatedReport = z.infer<typeof createdReportSchema>;
export type MyReport = z.infer<typeof myReportSchema>;
export type MyReportsPage = z.infer<typeof myReportsPageSchema>;
export type ReportOrder = z.infer<typeof reportOrderSchema>;
export type ReportFormValues = z.infer<typeof reportFormSchema>;
