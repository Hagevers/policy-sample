// data/chapter-questions.ts
import { ChapterQuestion } from "../types";

/**
 * Predefined questions for different health insurance policy chapter types
 * These questions target the most important coverage details to extract and compare
 */

export const chapterQuestions: Record<string, ChapterQuestion[]> = {
  'השתלות וטיפולים מיוחדים בחו"ל': [
    {
      id: "transplant-max-amount",
      question: "מהו סכום הכיסוי להשתלה?",
      chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
      keywords: [
        "כיסוי", // Insurance coverage
        "השתלה", // Transplant
        "₪", // Shekel sign to capture numerical values
      ],
      importance: "high",
      requiresNumericalAnswer: true,
    },
    // {
    //   id: "transplant-donor-search",
    //   question: "מהו הכיסוי לאיתור תורם?",
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["איתור", "תורם", "הוצאות"],
    //   importance: "high",
    //   requiresNumericalAnswer: true,
    // },
    // {
    //   id: "transplant-deductible",
    //   question: "מהי ההשתתפות העצמית בהשתלה?",
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["השתתפות", "עצמית", "השתלה", "תשלום"],
    //   importance: "high",
    //   requiresNumericalAnswer: true,
    // },
    // {
    //   id: "transplant-compensation",
    //   question: "האם קיים פיצוי חד פעמי לאחר השתלה ומה גובהו?",
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["פיצוי", "חד", "פעמי", "לאחר", "השתלה"],
    //   importance: "medium",
    //   requiresNumericalAnswer: true,
    // },
    // {
    //   id: "transplant-related-expenses",
    //   question: "מהו הכיסוי להוצאות נלוות להשתלה?",
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["הוצאות", "נלוות", "טיסה", "שהייה", "מלווה"],
    //   importance: "medium",
    //   requiresNumericalAnswer: true,
    // },
    // {
    //   id: "special-treatment-abroad",
    //   question: 'האם קיים כיסוי לטיפול מיוחד בחו"ל ומה היקפו?',
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["טיפול", "מיוחד", 'חו"ל'],
    //   importance: "high",
    //   requiresNumericalAnswer: true,
    // },
    // {
    //   id: "transplant-waiting-period",
    //   question: "מהי תקופת האכשרה לכיסוי השתלות?",
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["תקופת", "אכשרה", "המתנה"],
    //   importance: "medium",
    //   requiresNumericalAnswer: true,
    // },
    // {
    //   id: "transplant-age-limit",
    //   question: "האם קיימת הגבלת גיל לכיסוי השתלות?",
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["הגבלת", "גיל", "מקסימום"],
    //   importance: "low",
    // },
    // {
    //   id: "transplant-limitations",
    //   question: "מהן ההגבלות העיקריות לכיסוי השתלות?",
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["הגבלות", "חריגים", "סייגים"],
    //   importance: "medium",
    // },
    // {
    //   id: "transplant-future-coverage",
    //   question: "האם קיים כיסוי להשתלות עתידיות או טכנולוגיות חדשות?",
    //   chapterType: 'השתלות וטיפולים מיוחדים בחו"ל',
    //   keywords: ["עתידיות", "טכנולוגיות", "חדשות"],
    //   importance: "low",
    // },
  ],

  // "תרופות מחוץ לסל הבריאות": [
  //   {
  //     id: "medications-max-amount",
  //     question: "מהי תקרת הכיסוי לתרופות?",
  //     chapterType: "תרופות מחוץ לסל הבריאות",
  //     keywords: ["תקרת", "סכום", "מרבי", "מקסימלי", "תרופות"],
  //     importance: "high",
  //     requiresNumericalAnswer: true,
  //   },
  //   // {
  //   //   id: "medications-deductible",
  //   //   question: "מהי ההשתתפות העצמית לתרופות?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["השתתפות", "עצמית", "תשלום", "תרופה"],
  //   //   importance: "high",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "medications-off-label",
  //   //   question: "האם קיים כיסוי לתרופות בהתאמה אישית (OFF-LABEL)?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["התאמה", "אישית", "OFF-LABEL", "אוף לייבל"],
  //   //   importance: "high",
  //   // },
  //   // {
  //   //   id: "medications-orphan",
  //   //   question: "האם קיים כיסוי לתרופות יתום?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["תרופות", "יתום", "נדירות"],
  //   //   importance: "medium",
  //   // },
  //   // {
  //   //   id: "medications-waiting-period",
  //   //   question: "מהי תקופת האכשרה לכיסוי תרופות?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["תקופת", "אכשרה", "המתנה"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "medications-quantity-limit",
  //   //   question: "האם קיימת הגבלה על כמות התרופות?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["הגבלה", "כמות", "מספר"],
  //   //   importance: "medium",
  //   // },
  //   // {
  //   //   id: "medications-limitations",
  //   //   question: "מהן ההגבלות העיקריות לכיסוי תרופות?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["הגבלות", "חריגים", "סייגים"],
  //   //   importance: "medium",
  //   // },
  //   // {
  //   //   id: "medications-additional-services",
  //   //   question: "האם ישנו כיסוי לשירות או טיפול נלווה לתרופה?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["שירות", "טיפול", "נלווה"],
  //   //   importance: "low",
  //   // },
  //   // {
  //   //   id: "medications-age-limit",
  //   //   question: "האם קיימת הגבלת גיל לכיסוי תרופות?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["הגבלת", "גיל", "מקסימום"],
  //   //   importance: "low",
  //   // },
  //   // {
  //   //   id: "medications-update-mechanism",
  //   //   question: "מהו מנגנון העדכון של רשימת התרופות המכוסות?",
  //   //   chapterType: "תרופות מחוץ לסל הבריאות",
  //   //   keywords: ["מנגנון", "עדכון", "רשימת", "מכוסות"],
  //   //   importance: "low",
  //   // },
  // ],

  // 'ניתוחים וטיפולים בחו"ל': [
  //   {
  //     id: "surgeries-abroad-max-amount",
  //     question: 'מהו סכום הביטוח המרבי לניתוחים בחו"ל?',
  //     chapterType: 'ניתוחים וטיפולים בחו"ל',
  //     keywords: ["סכום", "מרבי", "ניתוח", 'חו"ל', "תקרה"],
  //     importance: "high",
  //     requiresNumericalAnswer: true,
  //   },
  //   // {
  //   //   id: "surgeries-abroad-deductible",
  //   //   question: 'מהי ההשתתפות העצמית בניתוחים בחו"ל?',
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["השתתפות", "עצמית", "ניתוח", 'חו"ל'],
  //   //   importance: "high",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-abroad-travel-expenses",
  //   //   question: 'האם קיים כיסוי להוצאות טיסה ושהייה בחו"ל?',
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["הוצאות", "טיסה", "שהייה", 'חו"ל'],
  //   //   importance: "high",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-abroad-companion",
  //   //   question: "האם קיים כיסוי למלווה והיקפו?",
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["מלווה", "כיסוי", "הוצאות"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-abroad-private-nurse",
  //   //   question: "האם קיים כיסוי לאחות פרטית והיקפו?",
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["אחות", "פרטית", "סיעוד"],
  //   //   importance: "low",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-abroad-medical-flight",
  //   //   question: "האם קיים כיסוי להטסה רפואית והיקפו?",
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["הטסה", "רפואית", "אמבולנס", "מטוס"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-abroad-rehabilitation",
  //   //   question: "האם קיים כיסוי להוצאות שיקום לאחר ניתוח?",
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["שיקום", "החלמה", "לאחר", "ניתוח"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-abroad-waiting-period",
  //   //   question: 'מהי תקופת האכשרה לכיסוי ניתוחים בחו"ל?',
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["תקופת", "אכשרה", "המתנה"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-abroad-limitations",
  //   //   question: 'מהן ההגבלות העיקריות לכיסוי ניתוחים בחו"ל?',
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["הגבלות", "חריגים", "סייגים"],
  //   //   importance: "medium",
  //   // },
  //   // {
  //   //   id: "surgeries-abroad-compensation",
  //   //   question: 'האם קיים פיצוי במקרה של ניתוח בחו"ל שבוצע ללא מעורבות המבטח?',
  //   //   chapterType: 'ניתוחים וטיפולים בחו"ל',
  //   //   keywords: ["פיצוי", "ללא", "מעורבות", "החזר"],
  //   //   importance: "low",
  //   //   requiresNumericalAnswer: true,
  //   // },
  // ],

  // "ניתוחים וטיפולים בארץ": [
  //   {
  //     id: "surgeries-israel-coverage-type",
  //     question:
  //       'איזה סוג כיסוי קיים לניתוחים בישראל (מסלול משלים שב"ן / מהשקל הראשון)?',
  //     chapterType: "ניתוחים וטיפולים בארץ",
  //     keywords: ["מסלול", "משלים", 'שב"ן', "שקל", "ראשון"],
  //     importance: "high",
  //   },
  //   // {
  //   //   id: "surgeries-israel-deductible",
  //   //   question: "מהי ההשתתפות העצמית בניתוחים בארץ?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["השתתפות", "עצמית", "ניתוח"],
  //   //   importance: "high",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-israel-surgeon-choice",
  //   //   question: "האם קיימת הגבלה על בחירת מנתח?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["בחירת", "מנתח", "רופא", "הגבלה"],
  //   //   importance: "high",
  //   // },
  //   // {
  //   //   id: "surgeries-israel-hospital-choice",
  //   //   question: "האם קיימת הגבלה על בחירת בית חולים?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["בחירת", "בית", "חולים", "הגבלה"],
  //   //   importance: "high",
  //   // },
  //   // {
  //   //   id: "surgeries-israel-pre-existing",
  //   //   question: "האם קיימת החרגה למצב רפואי קודם בכיסוי ניתוחים?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["מצב", "רפואי", "קודם", "החרגה"],
  //   //   importance: "high",
  //   // },
  //   // {
  //   //   id: "surgeries-israel-private-nurse",
  //   //   question: "האם קיים כיסוי לאחות פרטית לאחר ניתוח והיקפו?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["אחות", "פרטית", "לאחר", "ניתוח"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-israel-second-opinion",
  //   //   question: "האם קיים כיסוי לחוות דעת שנייה לפני ניתוח?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["חוות", "דעת", "שנייה", "התייעצות"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-israel-waiting-period",
  //   //   question: "מהי תקופת האכשרה לכיסוי ניתוחים בארץ?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["תקופת", "אכשרה", "המתנה"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "surgeries-israel-limitations",
  //   //   question: "מהן ההגבלות העיקריות לכיסוי ניתוחים בארץ?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["הגבלות", "חריגים", "סייגים"],
  //   //   importance: "medium",
  //   // },
  //   // {
  //   //   id: "surgeries-israel-compensation",
  //   //   question: "האם קיים פיצוי במקרה של ניתוח בבית חולים ציבורי?",
  //   //   chapterType: "ניתוחים וטיפולים בארץ",
  //   //   keywords: ["פיצוי", "בית", "חולים", "ציבורי"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  // ],

  // "שירותים אמבולטוריים": [
  //   {
  //     id: "ambulatory-consultations",
  //     question: "מהו הכיסוי להתייעצויות עם רופאים מומחים?",
  //     chapterType: "שירותים אמבולטוריים",
  //     keywords: ["התייעצות", "רופא", "מומחה"],
  //     importance: "high",
  //     requiresNumericalAnswer: true,
  //   },
  //   {
  //     id: "ambulatory-tests",
  //     question: "מהו הכיסוי לבדיקות אבחוניות?",
  //     chapterType: "שירותים אמבולטוריים",
  //     keywords: ["בדיקות", "אבחוניות", "הדמיה"],
  //     importance: "high",
  //     requiresNumericalAnswer: true,
  //   },
  //   // {
  //   //   id: "ambulatory-imaging",
  //   //   question: "מהו הכיסוי לבדיקות הדמיה (CT, MRI)?",
  //   //   chapterType: "שירותים אמבולטוריים",
  //   //   keywords: ["הדמיה", "CT", "MRI", "צילום"],
  //   //   importance: "high",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "ambulatory-treatments",
  //   //   question: "מהו הכיסוי לטיפולים אמבולטוריים?",
  //   //   chapterType: "שירותים אמבולטוריים",
  //   //   keywords: ["טיפולים", "אמבולטוריים", "פיזיותרפיה"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "ambulatory-annual-limit",
  //   //   question: "מהי תקרת הכיסוי השנתית לשירותים אמבולטוריים?",
  //   //   chapterType: "שירותים אמבולטוריים",
  //   //   keywords: ["תקרה", "שנתית", "סכום", "מרבי"],
  //   //   importance: "high",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "ambulatory-deductible",
  //   //   question: "מהי ההשתתפות העצמית בשירותים אמבולטוריים?",
  //   //   chapterType: "שירותים אמבולטוריים",
  //   //   keywords: ["השתתפות", "עצמית", "תשלום"],
  //   //   importance: "high",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "ambulatory-genetic-tests",
  //   //   question: "האם קיים כיסוי לבדיקות גנטיות?",
  //   //   chapterType: "שירותים אמבולטוריים",
  //   //   keywords: ["בדיקות", "גנטיות", "גנים"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "ambulatory-pregnancy-tests",
  //   //   question: "האם קיים כיסוי לבדיקות הקשורות להריון?",
  //   //   chapterType: "שירותים אמבולטוריים",
  //   //   keywords: ["בדיקות", "הריון", "סקירה"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "ambulatory-waiting-period",
  //   //   question: "מהי תקופת האכשרה לשירותים אמבולטוריים?",
  //   //   chapterType: "שירותים אמבולטוריים",
  //   //   keywords: ["תקופת", "אכשרה", "המתנה"],
  //   //   importance: "medium",
  //   //   requiresNumericalAnswer: true,
  //   // },
  //   // {
  //   //   id: "ambulatory-limitations",
  //   //   question: "מהן ההגבלות העיקריות לכיסוי שירותים אמבולטוריים?",
  //   //   chapterType: "שירותים אמבולטוריים",
  //   //   keywords: ["הגבלות", "חריגים", "סייגים"],
  //   //   importance: "medium",
  //   // },
  // ],
};
function cleanupChapterTitle(title: string): string {
  // Extract just the core chapter title
  const basicPattern = /פרק\s+([א-ת]'?)[:'']\s*([^\n]+)/;
  const match = title.match(basicPattern);

  if (match) {
    // Get the main part of the title
    let cleanTitle = match[0].trim();

    // Remove trailing numbers
    cleanTitle = cleanTitle.replace(/\s+\d+$/, "");

    // Remove extra description text after common separators
    const separators = ["שם הכיסוי", "תיאור הכיסוי", "(", "-"];
    for (const separator of separators) {
      const sepIndex = cleanTitle.indexOf(separator);
      if (sepIndex > 0) {
        cleanTitle = cleanTitle.substring(0, sepIndex).trim();
      }
    }

    return cleanTitle;
  }

  // Fallback - at least remove trailing numbers and long descriptions
  return title
    .replace(/\s+\d+$/, "")
    .split("שם הכיסוי")[0]
    .split("תיאור")[0]
    .trim();
}

/**
 * Normalize text for better matching
 */
function normalize(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[:"'.,()]/g, "")
    .replace(/\d+/g, "")
    .trim();
}

/**
 * Get questions for a specific chapter based on the chapter title
 * @param chapterTitle The title of the chapter
 * @param chapterQuestions Record of chapter types to questions mapping
 * @returns Array of questions for the chapter
 */
export function getQuestionsForChapter(
  chapterTitle: string
): ChapterQuestion[] {
  // Clean up the title first
  const cleanedTitle = cleanupChapterTitle(chapterTitle);
  console.log(`Original title: "${chapterTitle}"`);
  console.log(`Cleaned title: "${cleanedTitle}"`);

  const normalizedTitle = normalize(cleanedTitle);
  console.log(`Normalized title: "${normalizedTitle}"`);

  // Available chapter types from the questions data
  const availableChapterTypes = Object.keys(chapterQuestions);
  console.log(`Available chapter types: ${availableChapterTypes.join(", ")}`);

  // Define content patterns to recognize each chapter type
  const contentPatterns: Record<string, string[]> = {
    'השתלות וטיפולים מיוחדים בחו"ל': ["השתלות", "השתלה", "איבר", "מח עצם"],
    "תרופות מחוץ לסל הבריאות": ["תרופות", "סל", "תרופה"],
    'ניתוחים וטיפולים בחו"ל': ["ניתוח", "מחוץ לישראל", 'חו"ל', "מחליפי ניתוח"],
    "ניתוחים וטיפולים בארץ": ["ניתוח", "בישראל", 'שב"ן', "מהשקל הראשון"],
    "שירותים אמבולטוריים": ["אמבולטורי", "בדיקות", "התייעצות", "שירותים"],
    "מחלות קשות": [
      "מחלה קשה",
      "מחלות קשות",
      "גילוי מחלה",
      "הוצאות רפואיות",
      "שיפוי",
    ],
  };

  // 1. CONTENT-BASED MATCHING (PRIMARY METHOD)
  // Check for specific content indicators in the chapter title
  for (const [chapterType, patterns] of Object.entries(contentPatterns)) {
    // Count how many patterns match this title
    const matchCount = patterns.filter((pattern) =>
      normalizedTitle.includes(normalize(pattern))
    ).length;

    if (matchCount >= 2 || (patterns.length === 1 && matchCount === 1)) {
      console.log(`Content-based match found for chapter type: ${chapterType}`);

      // Find corresponding chapter type in available types
      for (const availableType of availableChapterTypes) {
        if (
          availableType.includes(chapterType) ||
          chapterType.includes(availableType)
        ) {
          return chapterQuestions[availableType];
        }
      }
    }
  }

  // 2. CHAPTER LETTER + CONTENT HINT (SECONDARY METHOD)
  // Extract the chapter letter but use it as a hint rather than strict mapping
  const chapterLetterMatch = cleanedTitle.match(/פרק\s+([א-ת]'?)/);
  if (chapterLetterMatch && chapterLetterMatch[1]) {
    const chapterLetter = chapterLetterMatch[1].replace(/'/g, "");
    console.log(`Using chapter letter ${chapterLetter} as a hint`);

    // Look for content hints in the title
    if (normalizedTitle.includes("השתל")) {
      return findChapterType("השתלות", null, availableChapterTypes);
    } else if (normalizedTitle.includes("תרופ")) {
      return findChapterType("תרופות", null, availableChapterTypes);
    } else if (
      normalizedTitle.includes("ניתוח") &&
      (normalizedTitle.includes("מחוץ") || normalizedTitle.includes('חו"ל'))
    ) {
      return findChapterType("ניתוחים", 'חו"ל', availableChapterTypes);
    } else if (
      normalizedTitle.includes("ניתוח") &&
      normalizedTitle.includes("ישראל")
    ) {
      return findChapterType("ניתוחים", "בארץ", availableChapterTypes);
    } else if (normalizedTitle.includes("אמבולטורי")) {
      return findChapterType("אמבולטורי", null, availableChapterTypes);
    } else if (
      normalizedTitle.includes("שיפוי") ||
      normalizedTitle.includes("מחלה קשה") ||
      normalizedTitle.includes("מחלות קשות")
    ) {
      return findChapterType("מחלה קשה", null, availableChapterTypes);
    }
  }

  // Remaining fallbacks could follow...

  console.log("No matching chapter type found, returning empty array");
  return [];
}

// Helper function to find matching chapter type
function findChapterType(
  keyword1: string,
  keyword2: string | null = null,
  availableTypes: string[]
): ChapterQuestion[] {
  for (const type of availableTypes) {
    const normalizedType = normalize(type);
    if (
      normalizedType.includes(normalize(keyword1)) &&
      (!keyword2 || normalizedType.includes(normalize(keyword2)))
    ) {
      console.log(`Found matching chapter type: ${type}`);
      return chapterQuestions[type];
    }
  }
  return [];
}
