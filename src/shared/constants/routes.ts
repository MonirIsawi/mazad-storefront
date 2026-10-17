export const ROUTES = {
  home: '/',
  /** First run: the brand page with slide to start (Bidoom design `welcome`). */
  welcome: '/welcome',
  /** One-way reports and suggestions (shown only when the API has support reports). */
  contact: '/contact',
  /** The contact form opened from an order, as a problem report with the order attached. */
  orderProblem: (orderId: string) => `/contact?orderId=${encodeURIComponent(orderId)}`,
  auctions: '/auctions',
  auctionDetail: (id: string) => `/auctions/${id}`,
  /** The full bid history of one auction (design `history`). */
  auctionBids: (id: string) => `/auctions/${id}/bids`,
  store: (id: string) => `/stores/${id}`,
  login: '/login',
  register: '/register',
  resetPassword: '/reset-password',
  account: '/account',
  help: '/help',
  helpTopic: (topic: string) => `/help/${topic}`,
  addressesList: '/account/addresses',
  myBids: '/account/bids',
  watchlistList: '/account/watchlist',
  following: '/account/following',
  sellerProfile: (id: string) => `/sellers/${id}`,
  notifications: '/account/notifications',
  wins: '/account/wins',
  orders: '/account/orders',
  orderDetail: (id: string) => `/account/orders/${id}`,
  payments: '/account/payments',
  // The seller's own side, hung off the account screen rather than a sixth tab (five is the
  // HIG ceiling — see AppTabBar).
  selling: '/account/selling',
  sellingStores: '/account/selling/stores',
  sellingProducts: '/account/selling/products',
  sellingAuctions: '/account/selling/auctions',
  sellingSales: '/account/selling/sales',
  saleDetail: (id: string) => `/account/selling/sales/${id}`,
  sellingAuctionNew: (productId: string) =>
    `/account/selling/auctions?productId=${encodeURIComponent(productId)}`,
} as const;
