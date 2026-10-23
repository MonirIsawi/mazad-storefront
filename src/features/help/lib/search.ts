import { HELP_CONTENT, HELP_TOPICS, type HelpBlock, type HelpTopic } from '../content';

export interface HelpSearchResult {
  topic: HelpTopic;
  /** The matching section's anchor, or null when the topic itself matched (its name or summary). */
  sectionId: string | null;
  title: string;
  /** Where it is: the topic's name for a section, the topic's one-liner for a topic. */
  context: string;
}

const ARABIC_MARKS = /[ً-ٰٟـ]/g;

/**
 * Folds the differences a searcher doesn't type: case, Arabic diacritics and tatweel, the alef
 * forms, taa marbuta and alef maqsura, and curly quotes.
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function blockText(block: HelpBlock): string {
  switch (block.type) {
    case 'paragraph':
    case 'pending':
    case 'link':
    case 'rule':
      return block.text;
    case 'bullets':
      return block.items.join(' ');
    case 'steps':
      return block.items.map((item) => item.text).join(' ');
    case 'example':
      return [block.caption, ...block.rows.map((row) => row.label)].join(' ');
    case 'contact':
      return '';
  }
}

const matchesAll = (haystack: string, terms: string[]) =>
  terms.every((term) => haystack.includes(term));

/**
 * Every topic and section whose words contain all the typed words, in reading order: a topic
 * whose name or summary matches comes before the sections inside it.
 */
export function searchHelp(query: string, locale: 'ar' | 'en'): HelpSearchResult[] {
  const terms = normalizeForSearch(query).split(' ').filter(Boolean);
  if (terms.length === 0) return [];
  return HELP_TOPICS.flatMap((topic) => {
    const page = HELP_CONTENT[topic][locale];
    const results: HelpSearchResult[] = [];
    const topicText = normalizeForSearch(`${page.title} ${page.blurb} ${page.summary}`);
    if (matchesAll(topicText, terms)) {
      results.push({ topic, sectionId: null, title: page.title, context: page.blurb });
    }
    for (const section of page.sections) {
      const text = normalizeForSearch(
        [section.heading, ...section.blocks.map(blockText)].join(' '),
      );
      if (matchesAll(text, terms)) {
        results.push({ topic, sectionId: section.id, title: section.heading, context: page.title });
      }
    }
    return results;
  });
}
