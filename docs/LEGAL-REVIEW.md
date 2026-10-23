# Help, Privacy and Terms: open items for the owner and a lawyer

The storefront's help and policy pages (`/help`, `/help/<topic>`) are written in
`src/features/help/content.ts`, in Arabic and English. This document lists every point in that copy
that is not final. Each one has an ID that appears in the content file. A test
(`src/features/help/help.test.tsx`) fails if an ID is used in the content but missing here, or the
other way round.

- **OD-n (OWNER_DECISION):** a business fact or policy that only the owner can decide.
- **LR-n (LEGAL_REVIEW_REQUIRED):** wording that a lawyer must approve before launch.

How the pages show them:

- **Privacy and Terms** carry one draft notice at the top. It says that the page is under review,
  including legal review, and that points marked "To be confirmed" are not decided yet.
- **Undecided points** (`pending` blocks) appear inline as a "To be confirmed" / «قيد التأكيد» note
  on any page. Today that covers every OD item, plus LR-4, LR-6 and LR-10.
- **Section-level LR references** are not shown. The page-level draft notice covers them.
- **No invented facts.** The pages don't name a company, registration number, address, email or
  phone number. Add them only when the owner provides them (OD-1, OD-2).

When an item is settled, do three things:

1. Update the copy in both languages.
2. Remove its `pending` block or `review` reference.
3. Delete its entry here.

Once no LR items are left, remove `isDraft` from Privacy and Terms. The tests require all three
steps to agree.

## What the copy states as fact (checked against mazad-api `main`, 2026-10-12)

| Claim on the pages                                                                                                                                                                                                                                                                      | Source in mazad-api                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The bid increment ladder (1,000 / 5,000 / 25,000 / 100,000 IQD), whole dinars, an opening price of at least 1,000 IQD, auctions of 1 hour to 14 days, and a buy-now price above the opening bid                                                                                         | `src/modules/auctions/auction-rules.ts`                                                                                                                |
| A late bid extends the auction: the window and extension are platform settings capped at 10 minutes, with at most 10 extensions                                                                                                                                                         | `auction-rules.ts` (`ANTI_SNIPING_WINDOW_CAP_MINUTES`, `EXTENSION_CAP_MINUTES`, `MAX_EXTENSIONS_CAP`); `PlatformSettings` defaults are 5 and 5 minutes |
| Bids are binding; a seller can't bid on their own auction; a bid at or above the buy-now price triggers buy now and ends the auction                                                                                                                                                    | `src/modules/bidding/bidding.service.ts` (`OWN_AUCTION_BID`, `buyNow`, `endAuctionNow`)                                                                |
| Bidders appear under an anonymous label; reviews show a short name                                                                                                                                                                                                                      | `maskName` in `auctions.service.ts`; prelaunch contract 5                                                                                              |
| The winner's order is created automatically with their default address. No confirmation step                                                                                                                                                                                            | `wins.service.ts` `autoFulfillWin`                                                                                                                     |
| The win passes to the next-highest bidder only when the order can't be created (no address, or the winner is no longer active), at most twice (ranks 2 and 3). A cancelled order is not passed on                                                                                       | `wins/fallback.util.ts` (`MAX_FALLBACK_OFFERS = 2`), `wins.service.ts` `expireWin` / `resolveUnfulfillable`, `orders.service.ts` `cancelOrder`         |
| Losing a win for lack of an address adds a no-show strike, and repeated strikes cause an automatic ban                                                                                                                                                                                  | `wins.service.ts` `expireWin` (`settlement.maxStrikes`, default 3)                                                                                     |
| The buyer can cancel only before the seller confirms; the seller can cancel only while the order is pending                                                                                                                                                                             | `orders.service.ts` `cancelOrder`, `SELLER_TRANSITIONS`                                                                                                |
| COD: the seller confirms the exact cash, which must equal the order total                                                                                                                                                                                                               | storefront `CASH_AMOUNT_MISMATCH`; prelaunch contract 8                                                                                                |
| Card payment runs through SwiftPayIQ's hosted page. Bidoom never handles card data. Payment is verified server-side, an order is paid once, and duplicates are flagged for review. Card refunds are made in SwiftPayIQ                                                                  | `docs/swiftpay/README.md`                                                                                                                              |
| Card payment is offered only when enabled, while the order is pending, confirmed or out for delivery                                                                                                                                                                                    | storefront `OrderPaymentSection.tsx` (`PAYABLE`, `swiftpay.enabled`)                                                                                   |
| Card money goes to Bidoom's single SwiftPayIQ merchant account, and Bidoom pays sellers outside the app, net of commission                                                                                                                                                              | `docs/swiftpay/README.md` (single merchant, `SellerPayable`)                                                                                           |
| Returns: 7 days from delivery, once per item (withdrawn or rejected requests can't be re-opened by the buyer), seller approve/reject, product returned, then refund. The refund is the item's price; the delivery fee is not included. An admin can reopen, decide and lower the amount | `src/modules/returns/returns.service.ts` (`RETURN_WINDOW_DAYS`, default 7; `refundAmount: item.finalPrice`)                                            |
| A commission is charged per sale, as a percentage set by the platform and snapshot on the auction. It is voided when the item is refunded                                                                                                                                               | `PlatformSettings.defaultCommission` (default 5), `auctions.service.ts`, `returns.service.ts` (`voidedCommission`)                                     |
| Auctions currently need admin approval                                                                                                                                                                                                                                                  | `PlatformSettings.manualAuctionApproval` (default `true`)                                                                                              |
| Moderation: block product, suspend store, ban user. Listings are withdrawn and bidders told. Unconfirmed orders are cancelled. Shipped orders go to an admin                                                                                                                            | admin controllers; `admin-users.service.ts` `ban`                                                                                                      |
| Phone verification uses a Telegram bot: the user shares their own contact, then gets the code                                                                                                                                                                                           | `src/modules/auth/otp/telegram-bot.service.ts`                                                                                                         |
| Account deletion anonymises the account and keeps transactions. There is a 30-day phone cooldown, enforced with a keyed hash                                                                                                                                                            | `docs/account-deletion-design.md`                                                                                                                      |
| Uploaded photos are re-encoded (sharp to WebP), which drops EXIF, including location                                                                                                                                                                                                    | `src/modules/uploads/uploads.service.ts`                                                                                                               |
| Third parties: Railway (hosting), Firebase Cloud Messaging (Android push), Telegram (codes), SwiftPayIQ (cards), OpenFreeMap (Android map tiles). The website self-hosts its fonts (next/font), so Google Fonts is no longer one                                                        | `docs/production-environment.md`, `notifications/fcm.channel.ts`, storefront `globals.css`, mobile `PinMap.tsx`                                        |
| The website uses localStorage for the session, language and theme. It has no analytics or ad SDKs                                                                                                                                                                                       | storefront `auth-session.ts`, `layout.tsx`, `package.json`                                                                                             |

## Corrections made in this revision

- **Winner who doesn't complete.** The old text said "if the winner does not complete the purchase,
  the item may be offered to the next highest bidder". That was too broad. The win only passes on
  when the order _can't be created_ (no address, or the winner is no longer active), at most twice.
  A cancelled order is never passed on.
- **Confirming the order.** "You confirm the order and choose how to pay" was wrong. Orders are
  created automatically, and the buyer can switch to card payment on the order page.
- **"Contact us from the help page".** This was removed because no contact channel exists. The
  pages now show "Support contact: to be announced" (OD-2).
- **Card brands.** "QiCard, local Mastercard or Visa" was removed. The SwiftPayIQ docs in mazad-api
  don't list accepted brands, so the copy now says "card payment through SwiftPayIQ". The accepted
  cards are shown on SwiftPayIQ's page.
- **Provider name.** "SwiftPay" now reads "SwiftPayIQ", the provider's actual name.

## OWNER_DECISION items

### OD-1: Who runs Bidoom

- **Where:** Privacy › About this policy; Terms › What Bidoom is.
- **Questions:**
  - What is the legal name of the company or person that operates Bidoom and is responsible for user
    data (the data controller)?
  - What is its registered address and its registration or commercial number?
  - Should the pages name it?

### OD-2: Support contact

- **Where:** Returns › If you can't agree; FAQ › How do I contact Bidoom?; Privacy › Contact;
  Terms › Contact. The pages show "Support contact: to be announced."
- **Status (2026-10-17):** the in-app report form (Contact us: a one-way report or suggestion with a
  reference and a status) is built. Where the deployed API has it, or a WhatsApp/Telegram channel is
  configured (`NEXT_PUBLIC_SUPPORT_WHATSAPP` / `NEXT_PUBLIC_SUPPORT_TELEGRAM`), those pages show it
  in place of "to be announced". The questions below about hours, reply times and a privacy address
  stay open.
- **Questions:**
  - Which channel will users have: an email address, a phone or WhatsApp number, the Telegram bot,
    or an in-app form?
  - What hours does it run, and how quickly should users expect an answer?
  - Is there a separate address for privacy requests and legal notices?

### OD-3: Commission rate

- **Where:** Selling › Commission; Terms › Fees.
- **Facts:** the API default `defaultCommission` is 5%. It is an admin setting and isn't exposed
  publicly. The rate is snapshotted per auction.
- **Questions:**
  - What rate should the pages state?
  - Is it the same for all sellers and categories?
  - Should sellers see the rate, or the net amount, when they publish? Today no client shows it.

### OD-4: Commission on cash-on-delivery sales

- **Where:** Selling › Commission.
- **Facts:** with COD the seller keeps all the cash. The API records commission, but nothing
  collects it.
- **Questions:**
  - How and when does a seller pay Bidoom the commission on cash sales (invoice, deduction from card
    payouts, a wallet)?
  - What happens if they don't pay?

### OD-5: Seller payouts for card sales

- **Where:** Selling › Commission.
- **Facts:** card money lands in Bidoom's SwiftPayIQ account. An admin records each transfer to the
  seller by hand (`SellerPayable`). `PlatformSettings.payoutDelayDays` has a default of 7.
- **Questions:**
  - How many days after delivery are sellers paid, and by what method (bank transfer, card)?
  - Is a payout held while the return window or a return is open?

### OD-6: Card processing fee

- **Where:** Payments › Card.
- **Facts:** the SwiftPayIQ go-live checklist says to set the fee bearer to the merchant (customer
  share 0). The code still accepts a customer fee share if SwiftPayIQ reports one.
- **Question:** confirm that buyers pay only the order total, and that Bidoom absorbs SwiftPayIQ's
  fee. Then remove the note.

### OD-7: Return shipping

- **Where:** Returns › What happens next.
- **Facts:** the code doesn't model return shipping at all. The refund is the item's price only.
- **Questions:**
  - Who arranges the return: does the buyer send it, or does the seller collect it?
  - Who pays the cost of sending it back?
  - Is the original delivery fee ever refunded, for example when the item was not as described?

### OD-8: Refunds on cash-on-delivery orders

- **Where:** Payments › Refunds; Returns › What happens next.
- **Facts:** for COD, the API only records the refund (payment `REFUNDED`). It moves no money.
- **Question:** who hands the money back (the seller in cash on collection? Bidoom?), how, and how
  fast?

### OD-9: Card refund timing

- **Where:** Payments › Refunds.
- **Facts:** an admin refunds in the SwiftPayIQ dashboard. The API has no refund endpoint.
- **Questions:**
  - How soon after a return is refunded in Bidoom does the admin refund in SwiftPayIQ?
  - How long does SwiftPayIQ take to return the money to the card?

### OD-10: Data retention

- **Where:** Privacy › How long we keep data.
- **Facts:** nothing is purged on a schedule today. After deletion the following are kept with no
  end date: orders and their delivery snapshot, bids, payments, returns, reviews, audit logs (with
  IPs) and the deleted-phone hash.
- **Questions:** how long each category is kept:
  - accounting and transaction records (the legal minimum?);
  - audit and security logs and IP addresses;
  - revoked sessions;
  - notifications;
  - the deleted-phone hash;
  - product-AI working data, if that feature is enabled.

  Also, what happens to inactive accounts?

### OD-11: Final list of service providers and data location

- **Where:** Privacy › Service providers.
- **Questions:**
  - Confirm that production runs on Railway (API, MySQL, Redis, photo storage), and in which
    region.
  - Who hosts the website (for example, Vercel)?
  - Are any other processors used in production, such as SMS or WhatsApp code delivery (the API
    has `OTP_CHANNEL`), or the product-AI providers (Google Gemini, SerpAPI)? Those are off by
    default and unused by the clients. If they are turned on, the policy must name them.
  - In which countries is the data stored?
  - (Answered 2026-10-17: the website now self-hosts its fonts, so Google Fonts no longer receives
    visitor IPs; the Privacy page no longer lists it.)

### OD-12: Minimum age

- **Where:** Privacy › Children; Terms › Your account.
- **Questions:**
  - What is the minimum age to register, bid or sell (for example 18)?
  - Should registration ask users to confirm it?

### OD-13: Seller delivery time

- **Where:** Selling › Your responsibilities.
- **Facts:** the API sets no deadline for confirming or delivering an order.
- **Questions:**
  - How long does a seller have to confirm and deliver an order?
  - What happens if they don't (automatic cancellation, strikes)?

## LEGAL_REVIEW_REQUIRED items

### LR-1: Marketplace role

- **Where:** Terms › What Bidoom is. The same idea appears in plain words in How auctions work › Who
  sells?
- **Questions:**
  - Is the statement "Bidoom isn't the seller; each sale is between the buyer and the seller, and the
    seller is responsible for the item and its delivery" correct and enforceable under Iraqi law?
  - Does it still hold given that Bidoom collects card payments (see LR-5) and moderates listings?

### LR-2: Prohibited items

- **Where:** Terms › Prohibited items.
- **Facts:** the draft is a baseline list:
  - illegal or licence-only items;
  - weapons, ammunition and explosives;
  - drugs and prescription medicines;
  - alcohol and tobacco;
  - counterfeits and IP infringement;
  - stolen goods;
  - adult content;
  - live animals;
  - hazardous materials;
  - official documents, IDs, personal data and accounts;
  - counterfeit money;
  - recalled or unsafe products.
- **Questions:**
  - Is the list complete and correct for Iraq?
  - Does it need additions, such as antiquities and cultural property, medical devices, or SIM
    cards?
  - Are alcohol and tobacco treated correctly?
  - What consequence should a seller who breaks the list face?

### LR-3: Liability

- **Where:** Terms › Liability.
- **Question:** is the generic limitation clause (no inspection or guarantee of items, no liability
  for indirect losses or force majeure, statutory rights preserved) valid under Iraqi law, and is
  the wording acceptable?

### LR-4: Disputes and governing law

- **Where:** Terms › Returns and disputes (shown as "To be confirmed").
- **Questions:**
  - Beyond returns, how are other buyer–seller disputes handled?
  - Is Bidoom's decision on a return final within the platform?
  - Which law governs the terms, and which courts have jurisdiction?

### LR-5: Collecting card payments for sellers

- **Where:** Terms › Payment.
- **Facts:** Bidoom collects card payments for all sellers through one SwiftPayIQ merchant account
  and pays them out manually. The SwiftPayIQ README notes that their terms make the merchant
  responsible for the products sold, that their terms don't mention marketplaces, and that written
  confirmation from SwiftPayIQ is pending.
- **Questions:**
  - Is this collection model allowed?
  - Does it change Bidoom's responsibility towards buyers?
  - How should the terms describe it?

### LR-6: Privacy legal basis and user rights

- **Where:** Privacy › What we collect, Why we use it, Who sees your data, Service providers, How
  long we keep data. A "To be confirmed" note sits in Why we use it.
- **Questions:**
  - Which data protection law applies (Iraq, plus any other country where data is stored)?
  - What is the legal basis for each use?
  - Which rights must be stated (access, correction, deletion, objection), and how are they
    exercised?
  - Is consent needed for cross-border transfers (see OD-11)?
  - Is the phrase "we don't sell your personal data" acceptable as written?

### LR-7: Changing the terms

- **Where:** Terms › Changes to these terms.
- **Facts:** the draft promises to publish the new version and to tell users about important
  changes in the app before they apply. There is no in-app mechanism for this yet.
- **Questions:**
  - Is that notice enough?
  - Must users accept the new terms again?
  - Should the pages show an effective date?

### LR-8: Moderation, suspension and bans

- **Where:** Terms › Moderation, Closing your account.
- **Questions:**
  - Are the stated powers (reject listings, block products, suspend stores, ban accounts) and the
    automatic ban after repeated lost wins worded acceptably?
  - Must Bidoom give reasons, or offer an appeal?

### LR-9: Binding bids

- **Where:** Terms › Bidding and buying.
- **Facts:** bids can't be withdrawn. The buyer can still cancel an order before the seller
  confirms it, and no penalty applies today.
- **Questions:**
  - Is a bid enforceable as a binding offer?
  - What may Bidoom or the seller do when a winner refuses to pay?
  - Is the draft's wording consistent with the buyer's ability to cancel before confirmation?

### LR-10: Seller legal obligations

- **Where:** Terms › Sellers (shown as "To be confirmed").
- **Questions:**
  - What must sellers be told about taxes, business licences and consumer protection when selling
    on Bidoom?
  - Do these differ for individuals and for stores?
