import { httpClient } from '@shared/api';
import {
  createdReportSchema,
  myReportsPageSchema,
  reportOrderSchema,
  reportOrdersSchema,
  type CreatedReport,
  type MyReportsPage,
  type ReportKind,
  type ReportOrder,
} from '../schemas/support.schema';

/** Orders offered in the picker: the most recent page of my orders. */
const ORDERS_LIMIT = 50;
const REPORTS_PAGE = 20;

export const supportApi = {
  /** 429 SUPPORT_REPORT_LIMIT past 10 a day; 404 ORDER_NOT_FOUND when the order isn't mine. */
  send: async (body: {
    kind: ReportKind;
    orderId?: string;
    message: string;
  }): Promise<CreatedReport> => {
    const response = await httpClient.post<unknown>('/support/reports', body);
    return createdReportSchema.parse(response.data);
  },

  myReports: async (cursor?: string): Promise<MyReportsPage> => {
    const response = await httpClient.get<unknown>('/me/support/reports', {
      params: { limit: REPORTS_PAGE, ...(cursor ? { cursor } : {}) },
    });
    return myReportsPageSchema.parse(response.data);
  },

  /** My orders as a buyer, newest first (a bare array, like the orders screen reads it). */
  myOrders: async (): Promise<ReportOrder[]> => {
    const response = await httpClient.get<unknown>('/me/orders', {
      params: { page: 1, limit: ORDERS_LIMIT },
    });
    return reportOrdersSchema.parse(response.data);
  },

  /** One order (mine as buyer or seller): an order linked from elsewhere that isn't in the list. */
  order: async (id: string): Promise<ReportOrder> => {
    const response = await httpClient.get<unknown>(`/orders/${encodeURIComponent(id)}`);
    return reportOrderSchema.parse(response.data);
  },
};
