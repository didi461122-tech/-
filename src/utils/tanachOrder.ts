/**
 * Canonical ordering of the 24 Books of Tanakh according to traditional Hebrew canon:
 * 1. Torah (תורה): בראשית, שמות, ויקרא, במדבר, דברים
 * 2. Former Prophets (נביאים ראשונים): יהושע, שופטים, שמואל (א-ב), מלכים (א-ב)
 * 3. Latter Prophets (נביאים אחרונים): ישעיהו, ירמיהו, יחזקאל, תרי עשר (וספריו)
 * 4. Writings (כתובים): תהילים, משלי, איוב
 * 5. Five Megillot (חמש מגילות): שיר השירים, רות, איכה, קהלת, אסתר
 * 6. Other Writings: דניאל, עזרא, נחמיה, דברי הימים (א-ב)
 */
export const TANACH_BOOKS_ORDER: string[] = [
  // תורה
  'בראשית',
  'שמות',
  'ויקרא',
  'במדבר',
  'דברים',

  // נביאים ראשונים
  'יהושע',
  'שופטים',
  'שמואל',
  'שמואל א',
  'שמואל ב',
  'מלכים',
  'מלכים א',
  'מלכים ב',

  // נביאים אחרונים
  'ישעיהו',
  'ירמיהו',
  'יחזקאל',
  'תרי עשר',
  'הושע',
  'יואל',
  'עמוס',
  'עובדיה',
  'יונה',
  'מיכה',
  'נחום',
  'חבקוק',
  'צפניה',
  'חגי',
  'זכריה',
  'מלאכי',

  // ספרי אמ"ת
  'תהילים',
  'משלי',
  'איוב',

  // חמש מגילות
  'שיר השירים',
  'רות',
  'איכה',
  'קהלת',
  'אסתר',

  // שאר כתובים
  'דניאל',
  'עזרא',
  'נחמיה',
  'עזרא ונחמיה',
  'דברי הימים',
  'דברי הימים א',
  'דברי הימים ב'
];

/**
 * Returns index in Tanakh canonical order, or -1 if topic is a general topic (not a book)
 */
export function getTanachBookIndex(topic: string): number {
  if (!topic) return -1;
  const clean = topic.trim().replace(/^ספר\s+/, '');
  
  // Exact match
  const exact = TANACH_BOOKS_ORDER.indexOf(clean);
  if (exact !== -1) return exact;

  // Prefix match (e.g. "בראשית א" or "שמואל")
  return TANACH_BOOKS_ORDER.findIndex(book => clean === book || clean.startsWith(book + ' '));
}

export function isTanachBook(topic: string): boolean {
  return getTanachBookIndex(topic) !== -1;
}

/**
 * Sorts topics array placing Tanakh books first in canonical biblical order,
 * followed by general topics in Hebrew alphabetical order.
 */
export function sortTopicsByTanach(topics: string[]): string[] {
  return [...topics].sort((a, b) => {
    const idxA = getTanachBookIndex(a);
    const idxB = getTanachBookIndex(b);

    // Both are Tanakh books -> sort by biblical canon
    if (idxA !== -1 && idxB !== -1) {
      return idxA - idxB;
    }
    // Only A is a Tanakh book -> A comes first
    if (idxA !== -1 && idxB === -1) {
      return -1;
    }
    // Only B is a Tanakh book -> B comes first
    if (idxA === -1 && idxB !== -1) {
      return 1;
    }
    // Both are general topics -> Hebrew alphabetical
    return a.localeCompare(b, 'he');
  });
}
