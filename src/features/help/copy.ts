/*
 * The help pages' own words (titles, labels, notices), beside the long-form content in content.ts.
 * Kept as typed bilingual constants rather than a lazily loaded i18n namespace, like the content:
 * these pages are public and must render in full on the server, with no loading gap.
 */

export interface HelpCopy {
  /** The phone bar's title on the help centre. */
  indexBar: string;
  /** The help centre's page heading. */
  indexHeading: string;
  account: string;
  help: string;
  topicsLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchClear: string;
  searchResults: (count: number) => string;
  searchEmpty: (query: string) => string;
  draftNotice: string;
  pendingLabel: string;
  /** The legal pages' breadcrumb and tab names. */
  legalCrumb: string;
  legalTabsLabel: string;
  legalTitles: Record<'terms' | 'privacy', string>;
  legalTabs: Record<'terms' | 'privacy', string>;
  inShort: string;
  /** The example box's own label for screen readers. */
  exampleLabel: string;
  stepsLabel: string;
}

const AR: HelpCopy = {
  indexBar: 'المساعدة والسياسات',
  indexHeading: 'كيف نساعدك؟',
  account: 'الحساب',
  help: 'المساعدة',
  topicsLabel: 'مواضيع المساعدة',
  searchLabel: 'ابحث في المساعدة',
  searchPlaceholder: 'ابحث في المساعدة',
  searchClear: 'مسح البحث',
  searchResults: (count) =>
    count === 1
      ? 'نتيجة واحدة'
      : count === 2
        ? 'نتيجتان'
        : count <= 10
          ? `${count} نتائج`
          : `${count} نتيجة`,
  searchEmpty: (query) => `لا يوجد في المساعدة ما يطابق «${query}». جرّب كلمة أخرى.`,
  draftNotice:
    'مسودة: هذه الصفحة قيد المراجعة، ومنها المراجعة القانونية، وقد تتغير قبل اعتمادها. والبنود المعلَّمة «قيد التأكيد» لم تُحسم بعد.',
  pendingLabel: 'قيد التأكيد',
  legalCrumb: 'الشروط والخصوصية',
  legalTabsLabel: 'الشروط والخصوصية',
  legalTitles: { terms: 'شروط الاستخدام', privacy: 'سياسة الخصوصية' },
  legalTabs: { terms: 'الشروط', privacy: 'الخصوصية' },
  inShort: 'بالمختصر',
  exampleLabel: 'مثال محسوب',
  stepsLabel: 'الخطوات بالترتيب',
};

const EN: HelpCopy = {
  indexBar: 'Help and policies',
  indexHeading: 'How can we help?',
  account: 'Account',
  help: 'Help',
  topicsLabel: 'Help topics',
  searchLabel: 'Search help',
  searchPlaceholder: 'Search help',
  searchClear: 'Clear search',
  searchResults: (count) => (count === 1 ? '1 result' : `${count} results`),
  searchEmpty: (query) => `Nothing in help matches “${query}”. Try another word.`,
  draftNotice:
    'Draft: this page is still being reviewed, including legally, and may change before it is final. Points marked “To be confirmed” are not decided yet.',
  pendingLabel: 'To be confirmed',
  legalCrumb: 'Terms & privacy',
  legalTabsLabel: 'Terms and privacy',
  legalTitles: { terms: 'Terms of use', privacy: 'Privacy policy' },
  legalTabs: { terms: 'Terms', privacy: 'Privacy' },
  inShort: 'In short',
  exampleLabel: 'Worked example',
  stepsLabel: 'Steps, in order',
};

export const HELP_COPY: Record<'ar' | 'en', HelpCopy> = { ar: AR, en: EN };
