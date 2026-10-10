import type { z } from 'zod';
import type {
  auctionFormSchema,
  productFormSchema,
  sellerAuctionSchema,
  sellerProductSchema,
  storeFormSchema,
  storeSchema,
  uploadedImageSchema,
  PRODUCT_CONDITIONS,
  SELLER_AUCTION_STATUSES,
} from '../schemas/selling.schema';

export type Store = z.infer<typeof storeSchema>;
export type SellerProduct = z.infer<typeof sellerProductSchema>;
export type SellerAuction = z.infer<typeof sellerAuctionSchema>;
export type UploadedImage = z.infer<typeof uploadedImageSchema>;

/*
 * Form schemas coerce ("12" → 12), so their input and output types differ and react-hook-form
 * needs both: `useForm<Input, unknown, Values>`. The `*Values` half is what reaches the API.
 */
export type StoreFormValues = z.output<typeof storeFormSchema>;
export type StoreFormInput = z.input<typeof storeFormSchema>;

export type ProductFormValues = z.output<typeof productFormSchema>;
export type ProductFormInput = z.input<typeof productFormSchema>;

export type AuctionFormValues = z.output<typeof auctionFormSchema>;
export type AuctionFormInput = z.input<typeof auctionFormSchema>;

export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];
export type SellerAuctionStatus = (typeof SELLER_AUCTION_STATUSES)[number];

/** Structurally satisfied by catalog's `Category` — the route passes them in, so selling never
 *  imports another feature slice (AGENTS.md rule 1), same seam as WinsPage's addresses. */
export interface SellingCategoryOption {
  id: string;
  name: string;
  /** No subcategories: the only kind a product should be filed under. */
  isLeaf?: boolean;
}
