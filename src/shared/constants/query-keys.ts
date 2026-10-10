export const QUERY_KEYS = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  home: {
    feed: ['home', 'feed'] as const,
  },
  catalog: {
    categories: ['catalog', 'categories'] as const,
    // Generic rather than importing the feature's filter type — shared/ must not import
    // from features/ (see AGENTS.md); TypeScript infers T from whatever the caller passes.
    auctions: <T>(filters: T) => ['catalog', 'auctions', filters] as const,
    auction: (id: string) => ['catalog', 'auction', id] as const,
    auctionBids: (id: string) => ['catalog', 'auction', id, 'bids'] as const,
    auctionSimilar: (id: string) => ['catalog', 'auction', id, 'similar'] as const,
    store: (id: string) => ['catalog', 'store', id] as const,
  },
  addresses: {
    list: ['addresses', 'list'] as const,
  },
  bidding: {
    // Bidding re-queries auction pricing under its own key/schema rather than reusing
    // catalog.auction(id) — sharing a query key across features with different queryFns is a
    // TanStack Query footgun (see the composition-seam note in the interactive-features plan).
    auctionPricing: (id: string) => ['bidding', 'auctionPricing', id] as const,
    myBids: <T>(filters: T) => ['bidding', 'myBids', filters] as const,
    myStanding: (id: string) => ['bidding', 'myStanding', id] as const,
  },
  watchlist: {
    list: ['watchlist', 'list'] as const,
  },
  wins: {
    list: ['wins', 'list'] as const,
  },
  orders: {
    list: ['orders', 'list'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    sales: ['orders', 'sales'] as const,
  },
  payments: {
    methods: ['payments', 'methods'] as const,
    order: (orderId: string) => ['payments', 'order', orderId] as const,
    mine: ['payments', 'mine'] as const,
  },
  notifications: {
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
  // The seller's own side of the marketplace. Separate from `sellers`, which is the buyer
  // looking at someone else's storefront.
  selling: {
    stores: ['selling', 'stores'] as const,
    products: ['selling', 'products'] as const,
    auctions: ['selling', 'auctions'] as const,
  },
  sellers: {
    profile: (id: string) => ['sellers', 'profile', id] as const,
    // A static key, not a filters factory — GET /me/following has no pagination UI in this pass,
    // same call shape as watchlist.list.
    following: ['sellers', 'following'] as const,
  },
} as const;
