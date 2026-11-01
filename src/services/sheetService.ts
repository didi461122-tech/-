import { Question, Difficulty } from '../types/quiz';
import { getApiUrl } from '../utils/serverConfig';

/**
 * ============================================================================
 * כתובת הגיליון הראשית - ניתן לעדכן כאן בקלות את הקישור לגיליון Google Sheets!
 * ============================================================================
 * הערה: ניתן להזין קישור רגיל של Google Sheets (עם /edit) או קישור ייצוא CSV.
 * המערכת תמיר אותו אוטומטית לפורמט CSV תקין.
 */
export const SHEET_URL: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTt7JoCpFDizAXcdjcVsV3OLymh8ZOzIuIZrALbY6U0TbQX2pdifjCKCGdAxIjoIsgY7gL5f4_gaal-/pub?output=csv';

const LOCAL_STORAGE_SHEET_KEY = 'tanach_quiz_custom_sheet_url';

/**
 * מאגר שאלות ברירת מחדל עשיר ומעמיק לתלמידי ישיבה תיכונית
 * כולל מקורות מדויקים, פסוקים ורמות קושי שונות.
 */
export const DEFAULT_QUESTIONS: Question[] = [
  // --- ספר בראשית ---
  {
    id: 'gen-1',
    questionType: 'רב ברירה',
    topic: 'בראשית',
    difficulty: 'קל',
    question: 'באיזה יום בבריאת העולם נבראו המאורות (השמש, הירח והכוכבים)?',
    correctAnswer: 'היום הרביעי',
    option2: 'היום השלישי',
    option3: 'היום החמישי',
    option4: 'היום הראשון',
    source: 'בראשית א, יד-יט',
    quote: 'וַיֹּאמֶר אֱלֹהִים יְהִי מְאֹרֹת בִּרְקִיעַ הַשָּׁמַיִם... וַיְהִי עֶרֶב וַיְהִי בֹקֶר יוֹם רְבִיעִי',
    author: 'נתנאל וינברג'
  },
  {
    id: 'gen-2',
    questionType: 'רב ברירה',
    topic: 'בראשית',
    difficulty: 'בינוני',
    question: 'מי היה בנם הבכור של יעקב ולאה?',
    correctAnswer: 'ראובן',
    option2: 'שמעון',
    option3: 'לוי',
    option4: 'יהודה',
    source: 'בראשית כט, לב',
    quote: 'וַתַּהַר לֵאָה וַתֵּלֶד בֵּן וַתִּקְרָא שְׁמוֹ רְאוּבֵן כִּי אָמְרָה כִּי רָאָה ה\' בְּעָנְיִי',
    author: 'נתנאל וינברג'
  },
  {
    id: 'gen-3',
    questionType: 'רב ברירה',
    topic: 'בראשית',
    difficulty: 'קשה',
    question: 'כמה שנות רעב עברו על מצרים כאשר ירדו אחי יוסף בפעם הראשונה?',
    correctAnswer: 'שנתיים',
    option2: 'שנה אחת',
    option3: 'שלוש שנים',
    option4: 'חמש שנים',
    source: 'בראשית מה, ו',
    quote: 'כִּי זֶה שְׁנָתַיִם הָרָעָב בְּקֶרֶב הָאָרֶץ וְעוֹד חָמֵשׁ שָׁנִים אֲשֶׁר אֵין חָרִישׁ וְקָצִיר',
    author: 'נתנאל וינברג'
  },
  {
    id: 'gen-4',
    questionType: 'רב ברירה',
    topic: 'בראשית',
    difficulty: 'בינוני',
    question: 'באיזה מקום קנה אברהם אבינו את חלקת הקבר לשרה אמנו?',
    correctAnswer: 'מערת המכפלה אשר בחברון',
    option2: 'שכם',
    option3: 'בית אל',
    option4: 'באר שבע',
    source: 'בראשית כג, יט',
    quote: 'וְאַחֲרֵי כֵן קָבַר אַבְרָהָם אֶת שָׂרָה אִשְׁתּוֹ אֶל מְעָרַת שְׂדֵה הַמַּכְפֵּלָה עַל פְּנֵי מַמְרֵא הִוא חֶבְרוֹן',
    author: 'נתנאל וינברג'
  },

  // --- ספר שמות ---
  {
    id: 'ex-1',
    questionType: 'רב ברירה',
    topic: 'שמות',
    difficulty: 'קל',
    question: 'מה הייתה המכה הראשונה מבין עשר מכות מצרים?',
    correctAnswer: 'דם',
    option2: 'צפרדע',
    option3: 'כינים',
    option4: 'ערוב',
    source: 'שמות ז, כ',
    quote: 'וַיָּרֶם בַּמַּטֶּה וַיַּךְ אֶת הַמַּיִם אֲשֶׁר בַּיְאֹר... וַיֵּהָפְכוּ כָּל הַמַּיִם אֲשֶׁר בַּיְאֹר לְדָם',
    author: 'נתנאל וינברג'
  },
  {
    id: 'ex-2',
    questionType: 'רב ברירה',
    topic: 'שמות',
    difficulty: 'בינוני',
    question: 'איזה כלי במזבח המשכן היה עשוי מנחושת מראות הצובאות?',
    correctAnswer: 'הכיור וכנו',
    option2: 'מזבח הקטורת',
    option3: 'הארון',
    option4: 'המנורה הטהורה',
    source: 'שמות לח, ח',
    quote: 'וַיַּעַשׂ אֵת הַכִּיּוֹר נְחֹשֶׁת וְאֵת כַּנּוֹ נְחֹשֶׁת בְּמַרְאֹת הַצֹּבְאֹת אֲשֶׁר צָבְאוּ פֶּתַח אֹהֶל מוֹעֵד',
    author: 'נתנאל וינברג'
  },
  {
    id: 'ex-3',
    questionType: 'רב ברירה',
    topic: 'שמות',
    difficulty: 'קשה',
    question: 'מי היו שני ראשי האומנים של בניית המשכן?',
    correctAnswer: 'בצלאל בן אורי ואהליאב בן אחיסמך',
    option2: 'בצלאל בן חור ונדב בן אהרן',
    option3: 'אלעזר בן אהרן ואיתמר בן אהרן',
    option4: 'יהושע בן נון וכלב בן יפונה',
    source: 'שמות לה, ל-לה',
    quote: 'רְאוּ קָרָא ה\' בְּשֵׁם בְּצַלְאֵל בֶּן אוּרִי בֶן חוּר לְמַטֵּה יְהוּדָה... וּלְהוֹרֹת נָתַן בְּלִבּוֹ הוּא וְאָהֳלִיאָב בֶּן אֲחִיסָמָךְ לְמַטֵּה דָן',
    author: 'נתנאל וינברג'
  },

  // --- ספר ויקרא ובמדבר ---
  {
    id: 'num-1',
    questionType: 'רב ברירה',
    topic: 'במדבר',
    difficulty: 'קל',
    question: 'מי היו שני המרגלים שהביאו דיבה טובה על ארץ ישראל ואמרו "טובה הארץ מאד מאד"?',
    correctAnswer: 'יהושע בן נון וכלב בן יפונה',
    option2: 'שמוע בן זכור ושפט בן חורי',
    option3: 'גד בן סוסי ויגאל בן יוסף',
    option4: 'נחבי בן ופסי וגאואל בן מכי',
    source: 'במדבר יד, ו-ז',
    quote: 'וִיהוֹשֻׁעַ בִּן נוּן וְכָלֵב בֶּן יְפֻנֶּה מִן הַתָּרִים אֶת הָאָרֶץ קָרְעוּ בִּגְדֵיהֶם... טוֹבָה הָאָרֶץ מְאֹד מְאֹד',
    author: 'נתנאל וינברג'
  },
  {
    id: 'num-2',
    questionType: 'רב ברירה',
    topic: 'במדבר',
    difficulty: 'בינוני',
    question: 'באיזה מקום בקעו המים מהסלע לאחר שמשה היכה בסלע במקום לדבר אליו?',
    correctAnswer: 'מי מריבה בקדש (מדבר צין)',
    option2: 'מרה',
    option3: 'אילים',
    option4: 'רפידים',
    source: 'במדבר כ, יג',
    quote: 'הֵמָּה מֵי מְרִיבָה אֲשֶׁר רָבוּ בְנֵי יִשְׂרָאֵל אֶת ה\' וַיִּקָּדֵשׁ בָּם',
    author: 'נתנאל וינברג'
  },
  {
    id: 'num-3',
    questionType: 'רב ברירה',
    topic: 'במדבר',
    difficulty: 'קשה',
    question: 'מה היו שמות חמש בנות צלפחד שדרשו נחלה בארץ ישראל?',
    correctAnswer: 'מחלה, נעה, חגלה, מלכה ותרצה',
    option2: 'דינה, מרים, יוכבד, צפורה ואלישבע',
    option3: 'עדה, צלה, נעמה, בסמת ומחלת',
    option4: 'הגר, קטורה, רות, ערפה ומיכל',
    source: 'במדבר כז, א',
    quote: 'וְאֵלֶּה שְׁמוֹת בְּנֹתָיו מַחְלָה נֹעָה וְחָגְלָה וּמִלְכָּה וְתִרְצָה',
    author: 'נתנאל וינברג'
  },

  // --- ספר יהושע ---
  {
    id: 'josh-1',
    questionType: 'רב ברירה',
    topic: 'יהושע',
    difficulty: 'קל',
    question: 'סביב איזו עיר סבבו בני ישראל שבע פעמים ביום השביעי עד שנפלו חומותיה?',
    correctAnswer: 'יריחו',
    option2: 'העי',
    option3: 'גבעון',
    option4: 'חברון',
    source: 'יהושע ו, טו-כ',
    quote: 'וַיְהִי בַּיּוֹם הַשְּׁבִיעִי... וַיָּסֹבּוּ אֶת הָעִיר כַּמִּשְׁפָּט הַזֶּה שֶׁבַע פְּעָמִים... וַתִּפֹּל הַחוֹמָה תַּחְתֶּיהָ',
    author: 'נתנאל וינברג'
  },
  {
    id: 'josh-2',
    questionType: 'רב ברירה',
    topic: 'יהושע',
    difficulty: 'בינוני',
    question: 'איזה עם הערים על יהושע וכרת עמו ברית כשהם התחזו לבאים מארץ רחוקה בבגדים ובלחם יבש?',
    correctAnswer: 'הגבעונים (החיוי)',
    option2: 'היבוסים',
    option3: 'העמונים',
    option4: 'הפלשתים',
    source: 'יהושע ט, ג-ו',
    quote: 'וְיֹשְׁבֵי גִבְעוֹן שָׁמְעוּ אֵת אֲשֶׁר עָשָׂה יְהוֹשֻׁעַ לִירִיחוֹ וְלָעָי... וַיַּעֲשׂוּ גַם הֵמָּה בְּעָרְמָה',
    author: 'נתנאל וינברג'
  },
  {
    id: 'josh-3',
    questionType: 'רב ברירה',
    topic: 'יהושע',
    difficulty: 'קשה',
    question: 'מי מעל בחרם יריחו ולקח אדרת שנער, כסף ולשון זהב, וגרם למפלת ישראל בעי?',
    correctAnswer: 'עכן בן כרמי למטה יהודה',
    option2: 'זמרי בן סלוא',
    option3: 'קרח בן יצהר',
    option4: 'דותן ואבירם',
    source: 'יהושע ז, א; כ-כא',
    quote: 'וַיִּמְעֲלוּ בְנֵי יִשְׂרָאֵל מַעַל בַּחֵרֶם וַיִּקַּח עָכָן בֶּן כַּרְמִי בֶן זַבְדִּי בֶן זֶרַח לְמַטֵּה יְהוּדָה מִן הַחֵרֶם',
    author: 'נתנאל וינברג'
  },

  // --- ספר שופטים ---
  {
    id: 'judg-1',
    questionType: 'רב ברירה',
    topic: 'שופטים',
    difficulty: 'קל',
    question: 'איזו נביאה ושופטת ישבה תחת תומר בהר אפרים והובילה יחד עם ברק בן אבינעם את הניצחון על סיסרא?',
    correctAnswer: 'דבורה הנביאה',
    option2: 'חולדה הנביאה',
    option3: 'מרים הנביאה',
    option4: 'אביגיל',
    source: 'שופטים ד, ד-ה',
    quote: 'וּדְבוֹרָה אִשָּׁה נְבִיאָה אֵשֶׁת לַפִּידוֹת הִיא שֹׁפְטָה אֶת יִשְׂרָאֵל בָּעֵת הַהִיא... וְהִיא יוֹשֶׁבֶת תַּחַת תֹּמֶר דְּבוֹרָה',
    author: 'נתנאל וינברג'
  },
  {
    id: 'judg-2',
    questionType: 'רב ברירה',
    topic: 'שופטים',
    difficulty: 'בינוני',
    question: 'באיזה מבחן צמצם גדעון את צבאו מעשרת אלפים ל-300 לוחמים בלבד?',
    correctAnswer: 'מבחן הליקוק במי עין חרוד',
    option2: 'מבחן קליעה באבן',
    option3: 'מבחן ריצה במעלה ההר',
    option4: 'מבחן תקיעה בשופר',
    source: 'שופטים ז, ה-ז',
    quote: 'כֹּל אֲשֶׁר יָלֹק בִּלְשׁוֹנוֹ מִן הַמַּיִם כַּאֲשֶׁר יָלֹק הַכֶּלֶב תַּצִּיג אוֹתוֹ לְבָד... וַיְהִי מִסְפַּר הַמֲלַקְקִים שְׁלֹשׁ מֵאוֹת אִישׁ',
    author: 'נתנאל וינברג'
  },
  {
    id: 'judg-3',
    questionType: 'רב ברירה',
    topic: 'שופטים',
    difficulty: 'קשה',
    question: 'מי הרג את סיסרא שר צבא יבין באמצעות יתד האוהל?',
    correctAnswer: 'יעל אשת חבר הקיני',
    option2: 'דבורה אשת לפידות',
    option3: 'עכסה בת כלב',
    option4: 'עתליה בת עמרי',
    source: 'שופטים ד, כא',
    quote: 'וַתִּקַּח יָעֵל אֵשֶׁת חֶבֶר אֶת יְתַד הָאֹהֶל וַתָּשֶׂם אֶת הַמַּקֶּבֶת בְּיָדָהּ וַתָּבוֹא אֵלָיו בַּלָּאט וַתִּתְקַע אֶת הַיָּתֵד בְּרַקָּתוֹ',
    author: 'נתנאל וינברג'
  },

  // --- ספר שמואל ---
  {
    id: 'sam-1',
    questionType: 'רב ברירה',
    topic: 'שמואל',
    difficulty: 'קל',
    question: 'מי היה המלך הראשון שנמשח על כל ישראל?',
    correctAnswer: 'שאול בן קיש',
    option2: 'דוד בן ישי',
    option3: 'שלמה בן דוד',
    option4: 'ירבעם בן נבט',
    source: 'שמואל א י, א',
    quote: 'וַיִּקַּח שְׁמוּאֵל אֶת פַּךְ הַשֶּׁמֶן וַיִּצֹק עַל רֹאשׁוֹ וַיִּשָּׁקֵהוּ וַיֹּאמֶר הֲלוֹא כִּי מְשָׁחֲךָ ה\' עַל נַחֲלָתוֹ לְנָגִיד',
    author: 'נתנאל וינברג'
  },
  {
    id: 'sam-2',
    questionType: 'רב ברירה',
    topic: 'שמואל',
    difficulty: 'בינוני',
    question: 'באיזה נשק הכריע דוד את גוליית הפלשתי בעמק האלה?',
    correctAnswer: 'קלע ואבן חלוקה מן הנחל',
    option2: 'חנית ורומח',
    option3: 'חרב פלשתית',
    option4: 'קשת וחצים',
    source: 'שמואל א יז, מט-נ',
    quote: 'וַיִּשְׁלַח דָּוִד אֶת יָדוֹ אֶל הַכֶּלִי וַיִּקַּח מִשָּׁם אֶבֶן וַיְקַלַּע וַיַּךְ אֶת הַפְּלִשְׁתִּי אֶל מִצְחוֹ... וַיַּחֲזֵק דָּוִד מִן הַפְּלִשְׁתִּי בַּקֶּלַע וּבָאֶבֶן',
    author: 'נתנאל וינברג'
  },
  {
    id: 'sam-3',
    questionType: 'רב ברירה',
    topic: 'שמואל',
    difficulty: 'בינוני',
    question: 'איזה שר צבא היה מנאמניו הקרובים ביותר של דוד המלך ולחם בראש צבאו?',
    correctAnswer: 'יואב בן צרויה',
    option2: 'אבנר בן נר',
    option3: 'בניהו בן יהוידע',
    option4: 'עמשא בן יתר',
    source: 'שמואל ב ח, טז',
    quote: 'וְיוֹאָב בֶּן צְרוּיָה עַל הַצָּבָא וִיהוֹשָׁפָט בֶּן אֲחִילוּד מַזְכִּיר',
    author: 'נתנאל וינברג'
  },
  {
    id: 'sam-4',
    questionType: 'רב ברירה',
    topic: 'שמואל',
    difficulty: 'קשה',
    question: 'מי המשיל לדוד המלך את "משל כבשת הרש" לאחר מעשה בת שבע ואוריה החתי?',
    correctAnswer: 'נתן הנביא',
    option2: 'שמואל הרמתי',
    option3: 'גד החוזה',
    option4: 'אחיה השילוני',
    source: 'שמואל ב יב, א-ז',
    quote: 'וַיִּשְׁלַח ה\' אֶת נָתָן אֶל דָּוִד... וַיֹּאמֶר נָתָן אֶל דָּוִד אַתָּה הָאִישׁ!',
    author: 'נתנאל וינברג'
  },

  // --- ספר מלכים ---
  {
    id: 'kings-1',
    questionType: 'רב ברירה',
    topic: 'מלכים',
    difficulty: 'קל',
    question: 'איזה מלך בנה את בית המקדש הראשון בירושלים?',
    correctAnswer: 'שלמה המלך',
    option2: 'דוד המלך',
    option3: 'חזקיהו המלך',
    option4: 'יאשיהו המלך',
    source: 'מלכים א ו, א-ב',
    quote: 'וַיְהִי בִשְׁמוֹנִים שָׁנָה וְאַרְבַּע מֵאוֹת שָׁנָה לְצֵאת בְּנֵי יִשְׂרָאֵל מֵאֶרֶץ מִצְרַיִם בַּשָּׁנָה הָרְבִיעִית... לִשְׁלֹמֹה עַל יִשְׂרָאֵל וַיִּבֶן הַבַּיִת לַה\'',
    author: 'נתנאל וינברג'
  },
  {
    id: 'kings-2',
    questionType: 'רב ברירה',
    topic: 'מלכים',
    difficulty: 'בינוני',
    question: 'באיזה הר התרחש המעמד המפורסם שבו הוכיח אליהו הנביא את נביאי הבעל וירדה אש מן השמיים?',
    correctAnswer: 'הר הכרמל',
    option2: 'הר סיני',
    option3: 'הר הגלבוע',
    option4: 'הר תבור',
    source: 'מלכים א יח, יט-כד',
    quote: 'וְעַתָּה שְׁלַח קְבֹץ אֵלַי אֶת כָּל יִשְׂרָאֵל אֶל הַר הַכַּרְמֶל וְאֶת נְבִיאֵי הַבַּעַל... וַתִּפֹּל אֵשׁ ה\' וַתֹּאכַל אֶת הָעֹלָה',
    author: 'נתנאל וינברג'
  },
  {
    id: 'kings-3',
    questionType: 'רב ברירה',
    topic: 'מלכים',
    difficulty: 'קשה',
    question: 'איזה מלך ממלכת יהודה חפר את נקבת המים המפורסמת בירושלים לקראת מצור סנחריב מלך אשור?',
    correctAnswer: 'חזקיהו המלך',
    option2: 'עוזיהו המלך',
    option3: 'אחז המלך',
    option4: 'מנשה המלך',
    source: 'מלכים ב כ, כ',
    quote: 'וְיֶתֶר דִּבְרֵי חִזְקִיָּהוּ וְכָל גְּבוּרָתוֹ וַאֲשֶׁר עָשָׂה אֶת הַבְּרֵכָה וְאֶת הַתְּעָלָה וַיָּבֵא אֶת הַמַּיִם הָעִירָה',
    author: 'נתנאל וינברג'
  },
  {
    id: 'kings-4',
    questionType: 'רב ברירה',
    topic: 'מלכים',
    difficulty: 'קשה',
    question: 'מי הציב שני עגלי זהב בבית אל ובדן כדי למנוע מעם ישראל לעלות לירושלים?',
    correctAnswer: 'ירבעם בן נבט',
    option2: 'אחאב בן עמרי',
    option3: 'רחבעם בן שלמה',
    option4: 'יהוא בן נמשי',
    source: 'מלכים א יב, כח-כט',
    quote: 'וַיִּוָּעַץ הַמֶּלֶךְ וַיַּעַשׂ שְׁנֵי עֶגְלֵי זָהָב וַיֹּאמֶר אֲלֵהֶם רַב לָכֶם מֵעֲלוֹת יְרוּשָׁלַ͏ִם... וַיָּשֶׂם אֶת הָאֶחָד בְּבֵית אֵל וְאֶת הָאֶחָד נָתַן בְּדָן',
    author: 'נתנאל וינברג'
  },

  // --- ספר ישעיהו, ירמיהו ויחזקאל ---
  {
    id: 'prophets-1',
    questionType: 'רב ברירה',
    topic: 'ישעיהו',
    difficulty: 'בינוני',
    question: 'איזה נביא אמר את נבואת השלום: "וְכִתְּתוּ חַרְבוֹתָם לְאִתִּים וַחֲנִיתוֹתֵיהֶם לְמַזְמֵרוֹת"?',
    correctAnswer: 'ישעיהו בן אמוץ',
    option2: 'ירמיהו הכהן',
    option3: 'יחזקאל בן בוזי',
    option4: 'עמוס מן הנוקדים',
    source: 'ישעיהו ב, ד',
    quote: 'וְשָׁפַט בֵּין הַגּוֹיִם וְהוֹכִיחַ לְעַמִּים רַבִּים וְכִתְּתוּ חַרְבוֹתָם לְאִתִּים וַחֲנִיתוֹתֵיהֶם לְמַזְמֵרוֹת',
    author: 'נתנאל וינברג'
  },
  {
    id: 'prophets-2',
    questionType: 'רב ברירה',
    topic: 'ירמיהו',
    difficulty: 'בינוני',
    question: 'איזה נביא מכונה "נביא החורבן" אשר ניבא בירושלים עד לחורבן בית המקדש הראשון?',
    correctAnswer: 'ירמיהו',
    option2: 'יחזקאל',
    option3: 'הושע',
    option4: 'זכריה',
    source: 'ירמיהו א, א-ג',
    quote: 'דִּבְרֵי יִרְמְיָהוּ בֶּן חִלְקִיָּהוּ מִן הַכֹּהֲנִים אֲשֶׁר בַּעֲנָתוֹת... עַד גְּלוֹת יְרוּשָׁלַ͏ִם בַּחֹדֶשׁ הַחֲמִישִׁי',
    author: 'נתנאל וינברג'
  },
  {
    id: 'prophets-3',
    questionType: 'רב ברירה',
    topic: 'יחזקאל',
    difficulty: 'קשה',
    question: 'באיזה חזון מפורסם ראה יחזקאל בקעה מלאה עצמות יבשות שקמו לתחייה לצבא גדול?',
    correctAnswer: 'חזון העצמות היבשות',
    option2: 'חזון המרכבה',
    option3: 'חזון המקדש העתידי',
    option4: 'חזון שני העצים',
    source: 'יחזקאל לז, א-י',
    quote: 'הָיְתָה עָלַי יַד ה\' וַיּוֹצִאֵנִי בְרוּחַ ה\' וַיְנִיחֵנִי בְּתוֹךְ הַבִּקְעָה וְהִיא מְלֵאָה עֲצָמוֹת... וַיִּחְיוּ וַיַּעַמְדוּ עַל רַגְלֵיהֶם חַיִל גָּדוֹל מְאֹד מְאֹד',
    author: 'נתנאל וינברג'
  },

  // --- מגילות וכתובים ---
  {
    id: 'ruth-1',
    questionType: 'רב ברירה',
    topic: 'מגילת רות',
    difficulty: 'קל',
    question: 'מי אמרה לחמותה: "כִּי אֶל אֲשֶׁר תֵּלְכִי אֵלֵךְ וּבַאֲשֶׁר תָּלִינִי אָלִין עַמֵּךְ עַמִּי וֵאלֹהַיִךְ אֱלֹהָי"?',
    correctAnswer: 'רות המואביה לנעמי',
    option2: 'ערפה לנעמי',
    option3: 'מיכל לדוד',
    option4: 'חנה לעלי',
    source: 'רות א, טז',
    quote: 'וַתֹּאמֶר רוּת אַל תִּפְגְּעִי בִי לְעָזְבֵךְ לָשׁוּב מֵאַחֲרָיִךְ כִּי אֶל אֲשֶׁר תֵּלְכִי אֵלֵךְ וּבַאֲשֶׁר תָּלִינִי אָלִין עַמֵּךְ עַמִּי וֵאלֹהַיִךְ אֱלֹהָי',
    author: 'נתנאל וינברג'
  },
  {
    id: 'esther-1',
    questionType: 'רב ברירה',
    topic: 'מגילת אסתר',
    difficulty: 'קל',
    question: 'באיזה חודש עברי הפיל המן הרשע פור להשמיד את היהודים?',
    correctAnswer: 'חודש אדר (הפור נפל בחודש ניסן על חודש אדר)',
    option2: 'חודש ניסן',
    option3: 'חודש תשרי',
    option4: 'חודש סיוון',
    source: 'אסתר ג, ז',
    quote: 'בַּחֹדֶשׁ הָרִאשׁוֹן הוּא חֹדֶשׁ נִיסָן... הִפִּיל פּוּר הוּא הַגּוֹרָל לִפְנֵי הָמָן... לְחֹדֶשׁ שְׁנֵים עָשָׂר הוּא חֹדֶשׁ אֲדָר',
    author: 'נתנאל וינברג'
  },
  {
    id: 'psalms-1',
    questionType: 'רב ברירה',
    topic: 'תהילים',
    difficulty: 'קל',
    question: 'באיזה מזמור בתהילים מופיע הפסוק: "ה\' רֹעִי לֹא אֶחְסָר בִּנְאוֹת דֶּשֶׁא יַרְבִּיצֵנִי"?',
    correctAnswer: 'מזמור כג',
    option2: 'מזמור א',
    option3: 'מזמור קכא',
    option4: 'מזמור קנ',
    source: 'תהילים כג, א-ב',
    quote: 'מִזְמוֹר לְדָוִד ה\' רֹעִי לֹא אֶחְסָר. בִּנְאוֹת דֶּשֶׁא יַרְבִּיצֵנִי עַל מֵי מְנֻחוֹת יְנַהֲלֵנִי',
    author: 'נתנאל וינברג'
  },
  {
    id: 'judg-4',
    questionType: 'רב ברירה',
    topic: 'שופטים',
    difficulty: 'בינוני',
    question: 'מה הייתה החידה שחד שמשון לפלשתים במשתה תמנתה?',
    correctAnswer: 'מֵהָאֹכֵל יָצָא מַאֲכָל וּמֵעַז יָצָא מָתוֹק',
    option2: 'אורחה ורבעה דמית',
    option3: 'מה מתוק מדבש ומה עז מארי',
    option4: 'טוב מראה עיניים מהלך נפש',
    source: 'שופטים יד, יד',
    quote: 'וַיֹּאמֶר לָהֶם מֵהָאֹכֵל יָצָא מַאֲכָל וּמֵעַז יָצָא מָתוֹק וְלֹא יָכְלוּ לְהַגִּיד הַחִידָה שְׁלֹשֶׁת יָמִים',
    author: 'נתנאל וינברג'
  },
  {
    id: 'kings-5',
    questionType: 'רב ברירה',
    topic: 'מלכים',
    difficulty: 'קשה',
    question: 'מי אמר למלך אחאב: "הֲרָצַחְתָּ וְגַם יָרָשְׁתָּ"?',
    correctAnswer: 'אליהו הנביא (בפרשת כרם נבות היזרעאלי)',
    option2: 'מיכיהו בן ימלה',
    option3: 'אלישע בן שפט',
    option4: 'יונה בן אמיתי',
    source: 'מלכים א כא, יט',
    quote: 'וְדִבַּרְתָּ אֵלָיו לֵאמֹר כֹּה אָמַר ה\' הֲרָצַחְתָּ וְגַם יָרָשְׁתָּ... בִּמְקוֹם אֲשֶׁר לָקְקוּ הַכְּלָבִים אֶת דַּם נָבוֹת יָלֹקּוּ הַכְּלָבִים אֶת דָּמְךָ גַּם אָתָּה',
    author: 'נתנאל וינברג'
  }
];

// Rich datasets for special game modes:

export interface ConnectionGroup {
  id: string;
  category: string;
  items: [string, string, string, string];
  sourceExplanation: string;
}

export const DEFAULT_CONNECTIONS: ConnectionGroup[] = [
  {
    id: 'conn-1',
    category: 'ארבעת ראשי השנים (מסכת ראש השנה / תנ"ך)',
    items: ['א\' בניסן', 'א\' באלול', 'א\' בתשרי', 'ט"ו בשבט'],
    sourceExplanation: 'ארבעה ראשי שנים הם: באחד בניסן, באחד באלול, באחד בתשרי, באחד בשבט/בט"ו בשבט.'
  },
  {
    id: 'conn-2',
    category: 'ערי מקלט בעבר הירדן המזרחי',
    items: ['בצר במדבר', 'ראמות בגלעד', 'גולן בבשן', 'קדש בגליל'],
    sourceExplanation: 'שלוש ערים בעבר הירדן וערי מקלט בארץ כנען (דברים ד / יהושע כ).'
  },
  {
    id: 'conn-3',
    category: 'בניה של רחל אמנו ובלהה שפחתה',
    items: ['יוסף', 'בנימין', 'דן', 'נפתלי'],
    sourceExplanation: 'בני רחל (יוסף ובנימין) ובני שפחתה בלהה שניתנו לרחל (דן ונפתלי).'
  },
  {
    id: 'conn-4',
    category: 'כלי המשכן המרכזיים',
    items: ['ארון הברית', 'שולחן הפנים', 'מנורת הזהב', 'מזבח הקטורת'],
    sourceExplanation: 'כלי המשכן שעמדו בקודש ובקודש הקודשים (ספר שמות).'
  }
];

export interface TrueFalseQuestion {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source: string;
}

export const DEFAULT_TRUE_FALSE: TrueFalseQuestion[] = [
  {
    id: 'tf-1',
    statement: 'שאול היה המלך הראשון שנמשח על ישראל.',
    isTrue: true,
    explanation: 'שמואל הנביא משח את שאול בן קיש למלך הראשון על ישראל.',
    source: 'שמואל א י, א'
  },
  {
    id: 'tf-2',
    statement: 'שלמה המלך מלך 70 שנה בירושלים.',
    isTrue: false,
    explanation: 'שלמה מלך 40 שנה בירושלים על כל ישראל (מלכים א יא, מב).',
    source: 'מלכים א יא, מב'
  },
  {
    id: 'tf-3',
    statement: 'אליהו הנביא עלה בסערה השמימה במרכבת אש וסוסי אש.',
    isTrue: true,
    explanation: 'וַיְהִי הֵמָּה הֹלְכִים הָלוֹךְ וְדַבֵּר וְהִנֵּה רֶכֶב אֵשׁ וְסוּסֵי אֵשׁ... וַיַּעַל אֵלִיָּהוּ בַּסְּעָרָה הַשָּׁמָיִם.',
    source: 'מלכים ב ב, יא'
  },
  {
    id: 'tf-4',
    statement: 'משה רבנו זכה לעבור את הירדן ולהיקבר בארץ ישראל.',
    isTrue: false,
    explanation: 'משה מת בארץ מואב על פי ה\' ונקבר בגיא בארץ מואב מול בית פעור.',
    source: 'דברים לד, ה-ו'
  },
  {
    id: 'tf-5',
    statement: 'מגילת רות נקראת בחג השבועות.',
    isTrue: true,
    explanation: 'נהוג לקרוא את מגילת רות בחג השבועות שהוא זמן מתן תורתנו וקציר חטים.',
    source: 'מנהגי ישראל'
  },
  {
    id: 'tf-6',
    statement: 'יהושע בן נון היה משבט יהודה.',
    isTrue: false,
    explanation: 'יהושע בן נון (הושע בן נון) היה משבט אפרים (במדבר יג, ח).',
    source: 'במדבר יג, ח'
  }
];

export interface TimelineEvent {
  id: string;
  order: number;
  title: string;
  period: string;
  description: string;
}

export const DEFAULT_TIMELINE_EVENTS: TimelineEvent[] = [
  { id: 't-1', order: 1, title: 'עקידת יצחק', period: 'תקופת האבות', description: 'אברהם עוקד את יצחק על הר המוריה' },
  { id: 't-2', order: 2, title: 'יציאת מצרים וקריעת ים סוף', period: 'משה במדבר', description: 'בני ישראל יוצאים ממצרים ביד רמה' },
  { id: 't-3', order: 3, title: 'חציית הירדן וכיבוש יריחו', period: 'יהושע', description: 'בני ישראל נכנסים לארץ כנען עם יהושע' },
  { id: 't-4', order: 4, title: 'ניצחון דבורה וברק על סיסרא', period: 'שופטים', description: 'דבורה שופטת ישראל ונחל קיש שוטפם' },
  { id: 't-5', order: 5, title: 'קרב דוד וגוליית בעמק האלה', period: 'שמואל', description: 'דוד מכריע את גוליית בקלע ובאבן' },
  { id: 't-6', order: 6, title: 'חנוכת בית המקדש הראשון', period: 'שלמה המלך', description: 'שלמה בונה וחונך את הבית בירושלים' },
  { id: 't-7', order: 7, title: 'מעמד אליהו בהר הכרמל', period: 'אחאב ואליהו', description: 'ה\' הוא האלהים - ירידת אש מן השמים' },
  { id: 't-8', order: 8, title: 'חורבן בית המקדש הראשון וגלות בבל', period: 'צדקיהו ונבוכדנאצר', description: 'נבוזראדן שורף את בית ה\' בחודש החמישי' }
];

/**
 * Converts a standard Google Sheets sharing URL to a CSV export URL
 */
export function formatGoogleSheetCsvUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';
  let trimmed = rawUrl.trim();

  // If already a direct CSV export link
  if (trimmed.includes('export?format=csv') || trimmed.includes('/pub?output=csv') || trimmed.endsWith('.csv')) {
    return trimmed;
  }

  // Handle published web links: https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml
  if (trimmed.includes('/pubhtml')) {
    return trimmed.replace(/\/pubhtml.*$/, '/pub?output=csv');
  }

  // Extract Sheet Key: https://docs.google.com/spreadsheets/d/{SHEET_ID}/...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Check if there is a gid (specific tab)
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Cleans a cell value: strips outer wrapping quotes and converts doubled quotes to single quotes
 */
function cleanField(val: string | undefined): string {
  if (!val) return '';
  let s = val.trim();
  // Strip outer enclosing quotes if wrapped
  if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
    s = s.substring(1, s.length - 1);
  }
  // Convert escaped doubled quotes to single quote
  s = s.replace(/""/g, '"');
  return s.trim();
}

/**
 * Robust CSV/TSV parser with specialized Hebrew Gershayim and comma preservation.
 * Prevents mid-cell quotes (like כ"ג, רש"י, תנ"ך) from corrupting CSV column boundaries.
 */
export function parseCsv(rawText: string): string[][] {
  // Strip BOM and zero-width characters
  const text = rawText.replace(/^\uFEFF/, '').replace(/[\u200B\u200C\u200D]/g, '');

  // Detect whether the input is Tab-Separated (e.g. copied from Google Sheets / Excel) or Comma-Separated
  const sampleLines = text.split('\n').slice(0, 5);
  const tabCounts = sampleLines.map(l => (l.match(/\t/g) || []).length);
  const commaCounts = sampleLines.map(l => (l.match(/,/g) || []).length);
  const avgTabs = tabCounts.reduce((a, b) => a + b, 0) / Math.max(1, tabCounts.length);
  const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / Math.max(1, commaCounts.length);
  const isTsv = avgTabs >= 4 && avgTabs > avgCommas;
  const delimiter = isTsv ? '\t' : ',';

  const lines: string[][] = [];
  let row: string[] = [];
  let curCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        curCell += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        // Lookahead to check if this quote actually closes the cell
        let peek = i + 1;
        while (peek < text.length && text[peek] === ' ') peek++;
        const afterPeek = text[peek];

        if (afterPeek === delimiter || afterPeek === '\r' || afterPeek === '\n' || afterPeek === undefined) {
          inQuotes = false;
          i = peek - 1; // skip forward to before delimiter
        } else if (/[\u0590-\u05FFa-zA-Z0-9]/.test(nextChar || '')) {
          // Unescaped Hebrew Gershayim or internal quote (e.g. כ"ג or רש"י) - keep as literal text
          curCell += char;
        } else {
          inQuotes = false;
        }
      } else {
        curCell += char;
      }
    } else {
      if (char === '"') {
        // Enclosing quote ONLY if at the start of the cell (before any content)
        if (curCell.trim().length === 0) {
          inQuotes = true;
          curCell = '';
        } else {
          // Mid-cell quote or Gershayim (like כ"ג, רש"י) - treat as literal character!
          curCell += char;
        }
      } else if (char === delimiter) {
        row.push(curCell.trim());
        curCell = '';
      } else if (char === '\r') {
        // skip carriage return
      } else if (char === '\n') {
        row.push(curCell.trim());
        if (row.length > 0 && row.some(cell => cell.length > 0)) {
          lines.push(row);
        }
        row = [];
        curCell = '';
        inQuotes = false; // Reset to ensure line-level isolation so one bad quote never corrupts other questions
      } else {
        curCell += char;
      }
    }
  }

  if (curCell.length > 0 || row.length > 0) {
    row.push(curCell.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Normalizes headers to match expected columns regardless of case, punctuation, quotes and spacing:
 */
function findHeaderIndex(headers: string[], names: string[]): number {
  return headers.findIndex(h => {
    const clean = h.trim().toLowerCase().replace(/["'`\s_\-.:]+/g, '');
    return names.some(n => clean === n.toLowerCase().replace(/["'`\s_\-.:]+/g, ''));
  });
}

/**
 * Parses questions from CSV text with automatic column detection and fallback heuristics
 */
export function parseQuestionsFromCsv(csvText: string): Question[] {
  const rows = parseCsv(csvText);

  if (rows.length < 2) {
    throw new Error('הגיליון ריק או שאינו מכיל שורות נתונים מספיקות (נמצאו פחות מ-2 שורות)');
  }

  const headers = rows[0];

  // Wide keyword matching for Hebrew and English headers
  let qTypeIdx = findHeaderIndex(headers, ['questiontype', 'סוגשאלה', 'סוג', 'type', 'question_type']);
  let topicIdx = findHeaderIndex(headers, ['topic', 'נושא', 'ספר', 'subject', 'category', 'נושאשאלה']);
  let diffIdx = findHeaderIndex(headers, ['difficulty', 'רמתקושי', 'קושי', 'רמה', 'level', 'diff']);
  let qTextIdx = findHeaderIndex(headers, ['question', 'שאלה', 'תוכןהשאלה', 'השאלה', 'תוכןשאלה', 'q', 'שאלות']);
  let correctIdx = findHeaderIndex(headers, ['correctanswer', 'תשובהנכונה', 'תשובה1', 'תשובהנכונה1', 'תשובהא', 'correct', 'תשובה', 'ans', 'answer', 'correct_answer']);
  let opt2Idx = findHeaderIndex(headers, ['option2', 'אפשרות2', 'תשובה2', 'מסיח1', 'מסיח', 'תשובהשגויה1', 'תשובהב', 'opt2', 'option_2']);
  let opt3Idx = findHeaderIndex(headers, ['option3', 'אפשרות3', 'תשובה3', 'מסיח2', 'תשובהשגויה2', 'תשובהג', 'opt3', 'option_3']);
  let opt4Idx = findHeaderIndex(headers, ['option4', 'אפשרות4', 'תשובה4', 'מסיח3', 'תשובהשגויה3', 'תשובהד', 'opt4', 'option_4']);
  let sourceIdx = findHeaderIndex(headers, ['source', 'מקור', 'מקורבתנך', 'ספרופסוק', 'מקורות', 'ספר', 'פסוק', 'sourcebook']);
  let quoteIdx = findHeaderIndex(headers, ['quote', 'ציטוט', 'ציטוטפסוקים', 'פסוקים', 'הפסוק']);
  let authorIdx = findHeaderIndex(headers, ['author', 'מחבר', 'מחברהשאלה', 'יוצר', 'שםמחבר']);

  let startRowIndex = 1;

  // Positional Fallback Heuristic:
  // If standard headers not found, but row has 11 columns matching the user's brief:
  // 0: type, 1: topic, 2: difficulty, 3: question, 4: correct, 5: opt2, 6: opt3, 7: opt4, 8: source, 9: quote, 10: author
  if (qTextIdx === -1 || correctIdx === -1) {
    if (headers.length >= 10) {
      qTypeIdx = 0;
      topicIdx = 1;
      diffIdx = 2;
      qTextIdx = 3;
      correctIdx = 4;
      opt2Idx = 5;
      opt3Idx = 6;
      opt4Idx = 7;
      sourceIdx = 8;
      quoteIdx = 9;
      authorIdx = 10;
    } else if (headers.length >= 5) {
      // 5-column standard format: Question, Correct, Distractor1, Distractor2, Distractor3
      qTextIdx = 0;
      correctIdx = 1;
      opt2Idx = 2;
      opt3Idx = 3;
      opt4Idx = 4;
      topicIdx = -1;
      diffIdx = -1;
      sourceIdx = -1;
      quoteIdx = -1;
      authorIdx = -1;
    }
  }

  // Check if first row is actually data rather than headers (e.g. if question text is in row 0)
  if (headers[qTextIdx]?.length > 25 || headers[qTextIdx]?.includes('?')) {
    startRowIndex = 0;
  }

  const parsedQuestions: Question[] = [];

  for (let i = startRowIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const qText = qTextIdx !== -1 ? cleanField(row[qTextIdx]) : '';
    const correctAns = correctIdx !== -1 ? cleanField(row[correctIdx]) : '';

    if (!qText || !correctAns) continue;

    let difficulty: Difficulty = 'בינוני';
    if (diffIdx !== -1 && row[diffIdx]) {
      const dStr = row[diffIdx].trim().toLowerCase();
      if (dStr.includes('קל') || dStr.includes('easy') || dStr === '1') difficulty = 'קל';
      else if (dStr.includes('קשה') || dStr.includes('hard') || dStr === '3') difficulty = 'קשה';
    }

    parsedQuestions.push({
      id: `sheet-${i}`,
      questionType: qTypeIdx !== -1 && row[qTypeIdx] ? cleanField(row[qTypeIdx]) : 'רב ברירה',
      topic: topicIdx !== -1 && row[topicIdx] ? cleanField(row[topicIdx]) : 'כללי',
      difficulty,
      question: qText,
      correctAnswer: correctAns,
      option2: opt2Idx !== -1 && row[opt2Idx] ? cleanField(row[opt2Idx]) : '',
      option3: opt3Idx !== -1 && row[opt3Idx] ? cleanField(row[opt3Idx]) : '',
      option4: opt4Idx !== -1 && row[opt4Idx] ? cleanField(row[opt4Idx]) : '',
      source: sourceIdx !== -1 && row[sourceIdx] ? cleanField(row[sourceIdx]) : 'תנ"ך',
      quote: quoteIdx !== -1 && row[quoteIdx] ? cleanField(row[quoteIdx]) : '',
      author: authorIdx !== -1 && row[authorIdx] ? cleanField(row[authorIdx]) : 'נתנאל וינברג'
    });
  }

  if (parsedQuestions.length === 0) {
    throw new Error('לא נמצאו שאלות תקינות בגיליון. יש לוודא שהעמודות Question ו-CorrectAnswer מכילות נתונים.');
  }

  // Ensure every single question has strictly 4 distinct options (American question format)
  const allAnswers = Array.from(new Set(parsedQuestions.flatMap(q => [q.correctAnswer, q.option2, q.option3, q.option4].filter(Boolean))));
  const fallbackAnswers = [
    'דוד המלך', 'שלמה המלך', 'משה רבנו', 'אברהם אבינו', 
    'יהושע בן נון', 'אהרן הכהן', 'שמואל הנביא', 'ירושלים', 
    'חברון', 'הר סיני', 'בית אל', 'שכם', 'יריחו', 'סדום'
  ];

  parsedQuestions.forEach(q => {
    const currentCorrect = q.correctAnswer;
    const distractors = [q.option2, q.option3, q.option4].filter(opt => Boolean(opt) && opt !== currentCorrect);
    const uniqueDistractors = Array.from(new Set(distractors));

    let poolIdx = 0;
    while (uniqueDistractors.length < 3 && poolIdx < allAnswers.length) {
      const candidate = allAnswers[poolIdx++];
      if (candidate && candidate !== currentCorrect && !uniqueDistractors.includes(candidate)) {
        uniqueDistractors.push(candidate);
      }
    }

    let fbIdx = 0;
    while (uniqueDistractors.length < 3 && fbIdx < fallbackAnswers.length) {
      const candidate = fallbackAnswers[fbIdx++];
      if (candidate && candidate !== currentCorrect && !uniqueDistractors.includes(candidate)) {
        uniqueDistractors.push(candidate);
      }
    }

    q.correctAnswer = currentCorrect;
    q.option2 = uniqueDistractors[0] || 'אפשרות ב\'';
    q.option3 = uniqueDistractors[1] || 'אפשרות ג\'';
    q.option4 = uniqueDistractors[2] || 'אפשרות ד\'';
    q.questionType = 'רב ברירה';
  });

  return parsedQuestions;
}

/**
 * Loads questions from either the configured Google Sheets URL or default questions.
 */
export async function loadQuizQuestions(customUrl?: string): Promise<{ questions: Question[]; sourceName: string }> {
  // Determine URL to use: customUrl parameter > localStorage > server default-sheet > SHEET_URL constant
  let activeUrl = customUrl;
  if (!activeUrl && typeof window !== 'undefined') {
    activeUrl = localStorage.getItem(LOCAL_STORAGE_SHEET_KEY) || '';
  }

  // If no URL in localStorage or param, check if the server has a globally configured default URL
  if (!activeUrl || activeUrl === 'YOUR_GOOGLE_SHEETS_CSV_EXPORT_URL_HERE' || activeUrl.trim() === '') {
    try {
      const defRes = await fetch(getApiUrl('/api/default-sheet'));
      if (defRes.ok) {
        const defData = await defRes.json();
        if (defData.defaultUrl && defData.defaultUrl.trim() !== '') {
          activeUrl = defData.defaultUrl.trim();
        }
      }
    } catch {
      // fallback to SHEET_URL
    }
  }

  if (!activeUrl || activeUrl === 'YOUR_GOOGLE_SHEETS_CSV_EXPORT_URL_HERE' || activeUrl.trim() === '') {
    if (SHEET_URL && !SHEET_URL.includes('YOUR_GOOGLE_SHEETS')) {
      activeUrl = SHEET_URL;
    } else {
      return {
        questions: [...DEFAULT_QUESTIONS],
        sourceName: 'מאגר תנ"ך מובנה (ברירת מחדל)'
      };
    }
  }

  // Handle direct pasted CSV data URI
  if (activeUrl.startsWith('data:text/csv')) {
    const commaIdx = activeUrl.indexOf(',');
    const decodedCsv = decodeURIComponent(activeUrl.substring(commaIdx + 1));
    const parsedQuestions = parseQuestionsFromCsv(decodedCsv);
    return {
      questions: parsedQuestions,
      sourceName: `קובץ/טקסט שהודבק (${parsedQuestions.length} שאלות)`
    };
  }

  const exportUrl = formatGoogleSheetCsvUrl(activeUrl);
  let csvText = '';

  // 1. Try fetching via our Server-Side Proxy to avoid CORS and redirects completely
  try {
    const proxyUrl = getApiUrl(`/api/sheet-proxy?url=${encodeURIComponent(exportUrl)}`);
    const proxyRes = await fetch(proxyUrl);

    if (proxyRes.ok) {
      csvText = await proxyRes.text();
    } else {
      const errJson = await proxyRes.json().catch(() => null);
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
      throw new Error(`שרת הפרוקסי החזיר שגיאה ${proxyRes.status}`);
    }
  } catch (proxyError) {
    console.warn('Server proxy failed, trying direct fetch:', proxyError);

    // 2. Fallback to direct client-side fetch
    try {
      const directRes = await fetch(exportUrl, {
        headers: {
          'Accept': 'text/csv, text/plain, */*'
        }
      });

      if (!directRes.ok) {
        throw new Error(`שגיאת רשת (${directRes.status}): ${directRes.statusText}`);
      }

      csvText = await directRes.text();
    } catch (directError) {
      const combinedMessage = proxyError instanceof Error ? proxyError.message : 'לא ניתן לגשת לקובץ ב-Google Sheets';
      throw new Error(combinedMessage);
    }
  }

  // Check if Google returned an HTML page (login required / private sheet)
  if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html') || csvText.includes('accounts.google.com')) {
    throw new Error('הגיליון מוגדר כפרטי. יש לפתוח את הגיליון ב-Google Sheets ולבחור: קובץ -> שיתוף -> "כל מי שיש לו את הקישור יכול לצפות"');
  }

  // Parse questions
  const parsedQuestions = parseQuestionsFromCsv(csvText);

  // Save successful URL in localStorage
  if (typeof window !== 'undefined' && customUrl) {
    localStorage.setItem(LOCAL_STORAGE_SHEET_KEY, customUrl);
  }

  return {
    questions: parsedQuestions,
    sourceName: `Google Sheets (${parsedQuestions.length} שאלות נטענו)`
  };
}

/**
 * Shuffles an array of options randomly
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
