/*
 * Help and trust pages: how auctions work, paying, returns, privacy, terms and common questions.
 * Plain content in both languages, kept here (not in the i18n bundles) because it is long-form and
 * reviewed as a whole. Privacy and Terms are drafts until Mazad's legal review signs them off, and
 * say so on the page.
 */

export const HELP_TOPICS = [
  'how-auctions-work',
  'payments',
  'returns',
  'faq',
  'privacy',
  'terms',
] as const;
export type HelpTopic = (typeof HELP_TOPICS)[number];

export interface HelpSection {
  heading: string;
  /** Paragraphs; a line starting with "• " renders as a list item. */
  body: string[];
}

export interface HelpPageContent {
  title: string;
  summary: string;
  /** Not yet approved by legal review: shown with a visible draft notice. */
  isDraft?: boolean;
  sections: HelpSection[];
}

type Bilingual = Record<'ar' | 'en', HelpPageContent>;

export const HELP_CONTENT: Record<HelpTopic, Bilingual> = {
  'how-auctions-work': {
    ar: {
      title: 'كيف تعمل المزادات',
      summary: 'زايد على ما تريد، وإذا فزت يصلك المنتج إلى عنوانك.',
      sections: [
        {
          heading: 'قبل المزايدة',
          body: [
            'افتح المزاد واقرأ الوصف وشاهد كل الصور، وتحقق من حالة المنتج ومدينة المتجر ورسوم التوصيل.',
            'تحتاج إلى حساب وعنوان توصيل محفوظ قبل مزايدتك الأولى. يمكنك تحديد موقعك على الخريطة أو كتابة العنوان.',
          ],
        },
        {
          heading: 'المزايدة',
          body: [
            'كل مزايدة جديدة يجب أن تكون أعلى من السعر الحالي بخطوة على الأقل. تحدد مزاد الخطوة حسب السعر:',
            '• أقل من 100,000 د.ع: خطوة 1,000 د.ع',
            '• من 100,000 حتى أقل من مليون: خطوة 5,000 د.ع',
            '• من مليون حتى أقل من 10 ملايين: خطوة 25,000 د.ع',
            '• 10 ملايين فما فوق: خطوة 100,000 د.ع',
            'المزايدة التزام: إذا فزت فأنت ملزم بإكمال الشراء.',
          ],
        },
        {
          heading: 'المزايدة التلقائية',
          body: [
            'حدد أعلى مبلغ تقبل دفعه، وتزايد مزاد عنك بأقل خطوة لازمة لتبقى في الصدارة، دون تجاوز حدك. يمكنك تغيير الحد أو إيقافه في أي وقت.',
          ],
        },
        {
          heading: 'التمديد عند المزايدة المتأخرة',
          body: [
            'إذا وصلت مزايدة في الدقائق الأخيرة يُمدَّد المزاد بضع دقائق، حتى يتمكن الجميع من الرد. يظهر التمديد على صفحة المزاد.',
          ],
        },
        {
          heading: 'بعد انتهاء المزاد',
          body: [
            'يفوز صاحب أعلى مزايدة. نبلغك بالفوز، ثم تؤكد الطلب وتختار طريقة الدفع: الدفع عند الاستلام أو بالبطاقة.',
            'إذا لم يكمل الفائز الشراء قد يُعرض المنتج على صاحب المزايدة التالية.',
          ],
        },
      ],
    },
    en: {
      title: 'How auctions work',
      summary: 'Bid on what you want; if you win, it is delivered to your address.',
      sections: [
        {
          heading: 'Before you bid',
          body: [
            'Open the auction, read the description, look at every photo, and check the condition, the store’s city and the delivery fee.',
            'You need an account and a saved delivery address before your first bid. You can pin your location on the map or type the address.',
          ],
        },
        {
          heading: 'Bidding',
          body: [
            'Each new bid must beat the current price by at least one step. Mazad sets the step by price:',
            '• Under 100,000 IQD: 1,000 IQD',
            '• 100,000 to under 1 million: 5,000 IQD',
            '• 1 million to under 10 million: 25,000 IQD',
            '• 10 million and above: 100,000 IQD',
            'A bid is a commitment: if you win, you are expected to complete the purchase.',
          ],
        },
        {
          heading: 'Automatic bidding',
          body: [
            'Set the most you are willing to pay, and Mazad bids for you by the smallest step needed to keep you in the lead, never above your limit. You can change or stop it at any time.',
          ],
        },
        {
          heading: 'Late bids extend the auction',
          body: [
            'If a bid arrives in the last minutes, the auction is extended by a few minutes so everyone can answer. The extension shows on the auction page.',
          ],
        },
        {
          heading: 'When the auction ends',
          body: [
            'The highest bidder wins. We tell you, then you confirm the order and choose how to pay: cash on delivery or card.',
            'If the winner does not complete the purchase, the item may be offered to the next highest bidder.',
          ],
        },
      ],
    },
  },
  payments: {
    ar: {
      title: 'طرق الدفع',
      summary: 'تدفع بعد الفوز، عند تأكيد الطلب: نقدًا عند الاستلام أو بالبطاقة.',
      sections: [
        {
          heading: 'الدفع عند الاستلام',
          body: [
            'تدفع للبائع نقدًا عند وصول الطلب. يؤكد البائع في التطبيق أنه استلم المبلغ كاملًا قبل أن يُسجَّل الطلب مُسلَّمًا ومدفوعًا.',
          ],
        },
        {
          heading: 'الدفع بالبطاقة',
          body: [
            'ادفع عبر صفحة الدفع الآمنة لـ SwiftPay باستخدام بطاقة عراقية (كي كارد، ماستركارد أو فيزا محلية). لا تمر بيانات بطاقتك عبر مزاد.',
            'يتحقق خادم مزاد من الدفع مباشرة مع SwiftPay قبل اعتباره مدفوعًا، ويُسجَّل الطلب مدفوعًا مرة واحدة فقط.',
          ],
        },
        {
          heading: 'متى تختار',
          body: [
            'تختار طريقة الدفع بعد الفوز عند تأكيد الطلب، وليس عند المزايدة. المبلغ هو سعر الفوز مضافًا إليه رسوم التوصيل المعروضة في صفحة المزاد.',
          ],
        },
      ],
    },
    en: {
      title: 'Payment methods',
      summary: 'You pay after you win, when you confirm the order: cash on delivery or card.',
      sections: [
        {
          heading: 'Cash on delivery',
          body: [
            'Pay the seller in cash when the order arrives. The seller confirms in the app that they received the full amount before the order is marked delivered and paid.',
          ],
        },
        {
          heading: 'Card',
          body: [
            'Pay on SwiftPay’s secure payment page with an Iraqi card (QiCard, local Mastercard or Visa). Your card details never pass through Mazad.',
            'Mazad’s server verifies the payment directly with SwiftPay before treating it as paid, and an order is recorded as paid only once.',
          ],
        },
        {
          heading: 'When you choose',
          body: [
            'You choose how to pay after you win, when you confirm the order — not when you bid. The amount is your winning price plus the delivery fee shown on the auction page.',
          ],
        },
      ],
    },
  },
  returns: {
    ar: {
      title: 'الإرجاع',
      summary: 'إذا لم يطابق المنتج الوصف، اطلب الإرجاع خلال 7 أيام من الاستلام.',
      sections: [
        {
          heading: 'كيف تطلب الإرجاع',
          body: [
            'افتح الطلب واختر «طلب إرجاع» للمنتج، واكتب السبب. يمكنك الطلب خلال 7 أيام من التسليم.',
            'يراجع البائع الطلب: إذا وافق تعيد المنتج، وبعد استلامه يُعاد إليك المبلغ.',
          ],
        },
        {
          heading: 'إذا لم تتفقا',
          body: [
            'تراجع مزاد الطلبات المرفوضة أو المتعثرة. تواصل معنا من صفحة المساعدة وأرفق رقم الطلب.',
          ],
        },
      ],
    },
    en: {
      title: 'Returns',
      summary: 'If an item is not as described, request a return within 7 days of delivery.',
      sections: [
        {
          heading: 'How to request a return',
          body: [
            'Open the order, choose "Request a return" on the item and say why. You can ask within 7 days of delivery.',
            'The seller reviews it: once approved you send the item back, and once they receive it you are refunded.',
          ],
        },
        {
          heading: 'If you can’t agree',
          body: [
            'Mazad reviews rejected or stuck returns. Contact us from the help page with your order number.',
          ],
        },
      ],
    },
  },
  faq: {
    ar: {
      title: 'أسئلة شائعة',
      summary: 'أجوبة سريعة عن الحساب والمزايدة والطلبات.',
      sections: [
        {
          heading: 'هل أستطيع إلغاء مزايدة؟',
          body: [
            'لا. المزايدة التزام، فزايد فقط بما تنوي دفعه. يمكنك إيقاف المزايدة التلقائية قبل أن تزايد مجددًا.',
          ],
        },
        {
          heading: 'لماذا لا أستطيع المزايدة؟',
          body: [
            'تأكد أنك مسجّل الدخول ولديك عنوان توصيل محفوظ، وأن المزاد ما زال مباشرًا، وأن مزايدتك تساوي الحد الأدنى المعروض أو أكثر.',
          ],
        },
        {
          heading: 'هل رقم هاتفي ظاهر للآخرين؟',
          body: [
            'لا يظهر رقمك أو عنوانك للعامة. يرى البائع عنوان التوصيل وهاتف التوصيل فقط للطلبات التي اشتريتها منه، ليتمكن من إيصالها.',
          ],
        },
        {
          heading: 'كيف أبيع على مزاد؟',
          body: [
            'من حسابك افتح «البيع»: أنشئ متجرًا، أضف منتجًا بصورة واحدة على الأقل، ثم انشر مزادًا. يكفي وصف بلغة واحدة.',
          ],
        },
      ],
    },
    en: {
      title: 'Help & FAQ',
      summary: 'Quick answers about your account, bidding and orders.',
      sections: [
        {
          heading: 'Can I cancel a bid?',
          body: [
            'No. A bid is a commitment, so only bid what you intend to pay. You can stop an automatic bid before it bids again.',
          ],
        },
        {
          heading: 'Why can’t I bid?',
          body: [
            'Check that you are signed in and have a saved delivery address, that the auction is still live, and that your bid is at least the minimum shown.',
          ],
        },
        {
          heading: 'Is my phone number visible to others?',
          body: [
            'Your phone and address are never public. A seller sees the delivery address and phone only for orders you bought from them, so they can deliver.',
          ],
        },
        {
          heading: 'How do I sell on Mazad?',
          body: [
            'From your account open "Selling": create a store, add a product with at least one photo, then publish an auction. A description in one language is enough.',
          ],
        },
      ],
    },
  },
  privacy: {
    ar: {
      title: 'الخصوصية',
      summary: 'ما نجمعه ولماذا، وما نشاركه.',
      isDraft: true,
      sections: [
        {
          heading: 'ما نجمعه',
          body: [
            '• رقم الهاتف والاسم لإنشاء الحساب وتسجيل الدخول.',
            '• عناوين التوصيل، ومنها الموقع على الخريطة إن اخترته، لإيصال الطلبات.',
            '• المزايدات والطلبات والمدفوعات لتشغيل المزادات وتسويتها.',
            'لا نطلب موقعك إلا عندما تضغط «استخدام موقعي الحالي»، ولا نتتبع موقعك في الخلفية.',
          ],
        },
        {
          heading: 'ما نشاركه',
          body: [
            'يرى البائع عنوان التوصيل وهاتف التوصيل فقط لطلباتك منه. لا يظهر رقمك أو عنوانك أو موقعك في الصفحات العامة. مدفوعات البطاقة تتم لدى SwiftPay، ولا نخزن بيانات البطاقات.',
          ],
        },
        {
          heading: 'حذف الحساب',
          body: [
            'يمكنك حذف حسابك من صفحة الحساب. تشرح صفحة «حذف الحساب» ما يُحذف وما يُحتفظ به قانونيًا.',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy',
      summary: 'What we collect and why, and what we share.',
      isDraft: true,
      sections: [
        {
          heading: 'What we collect',
          body: [
            '• Your phone number and name, to create your account and sign you in.',
            '• Delivery addresses, including a map location if you choose one, to deliver your orders.',
            '• Bids, orders and payments, to run and settle auctions.',
            'We ask for your location only when you tap "Use my current location", and never track it in the background.',
          ],
        },
        {
          heading: 'What we share',
          body: [
            'A seller sees the delivery address and phone only for your orders from them. Your phone, address and location never appear on public pages. Card payments happen at SwiftPay; we do not store card details.',
          ],
        },
        {
          heading: 'Deleting your account',
          body: [
            'You can delete your account from the account page. The "Delete your account" page explains what is removed and what must be kept by law.',
          ],
        },
      ],
    },
  },
  terms: {
    ar: {
      title: 'الشروط والأحكام',
      summary: 'القواعد الأساسية لاستخدام مزاد.',
      isDraft: true,
      sections: [
        {
          heading: 'المزايدة والشراء',
          body: [
            'المزايدة عرض ملزم بالشراء بالسعر الذي زايدت به إذا فزت. على الفائز تأكيد الطلب ودفع المبلغ مع رسوم التوصيل.',
          ],
        },
        {
          heading: 'البائعون',
          body: [
            'يلتزم البائع بوصف صادق وصور حقيقية للمنتج وحالته، وبتسليم المنتج المطابق للوصف. يُمنع عرض المنتجات المحظورة أو المقلدة.',
          ],
        },
        {
          heading: 'الإشراف',
          body: [
            'يجوز لمزاد إخفاء الإعلانات المخالفة وإلغاء المزادات وتعليق المتاجر أو الحسابات، مع إبلاغ الأطراف المعنية.',
          ],
        },
      ],
    },
    en: {
      title: 'Terms',
      summary: 'The basic rules for using Mazad.',
      isDraft: true,
      sections: [
        {
          heading: 'Bidding and buying',
          body: [
            'A bid is a binding offer to buy at that price if you win. The winner confirms the order and pays the price plus the delivery fee.',
          ],
        },
        {
          heading: 'Sellers',
          body: [
            'Sellers describe items honestly with real photos and their true condition, and deliver what they described. Prohibited and counterfeit items are not allowed.',
          ],
        },
        {
          heading: 'Moderation',
          body: [
            'Mazad may hide listings that break the rules, cancel auctions and suspend stores or accounts, telling the people affected.',
          ],
        },
      ],
    },
  },
};
