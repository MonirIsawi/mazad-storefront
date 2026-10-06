export const ROUTES = {
  home: '/',
  auctions: '/auctions',
  auctionDetail: (id: string) => `/auctions/${id}`,
  store: (id: string) => `/stores/${id}`,
  login: '/login',
  register: '/register',
  resetPassword: '/reset-password',
  account: '/account',
  addressesList: '/account/addresses',
  myBids: '/account/bids',
  watchlistList: '/account/watchlist',
  following: '/account/following',
  sellerProfile: (id: string) => `/sellers/${id}`,
  notifications: '/account/notifications',
  wins: '/account/wins',
  orders: '/account/orders',
  orderDetail: (id: string) => `/account/orders/${id}`,
  // The seller's own side, hung off the account screen rather than a sixth tab (five is the
  // HIG ceiling — see AppTabBar).
  selling: '/account/selling',
  sellingStores: '/account/selling/stores',
  sellingProducts: '/account/selling/products',
  sellingAuctions: '/account/selling/auctions',
  sellingAuctionNew: (productId: string) =>
    `/account/selling/auctions?productId=${encodeURIComponent(productId)}`,
} as const;
