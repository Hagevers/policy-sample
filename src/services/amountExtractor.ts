// src/services/amountExtractor.ts
export class AmountExtractor {
  static extractAmounts(text: string): { amount: number; currency: string }[] {
    const amounts: { amount: number; currency: string }[] = [];

    // חיפוש סכומים בשקלים
    const shekelPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:₪|ש"ח|שקלים)/g;
    let match;
    while ((match = shekelPattern.exec(text)) !== null) {
      amounts.push({
        amount: parseFloat(match[1].replace(/,/g, "")),
        currency: "₪",
      });
    }

    // חיפוש סכומים בדולרים
    const dollarPattern =
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)|(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:דולר|USD)/g;
    while ((match = dollarPattern.exec(text)) !== null) {
      amounts.push({
        amount: parseFloat((match[1] || match[2]).replace(/,/g, "")),
        currency: "$",
      });
    }

    // טיפול במקרים של כתיבה הפוכה (מימין לשמאל)
    const rtlNumberPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*דע/g;
    while ((match = rtlNumberPattern.exec(text)) !== null) {
      const amountStr = match[1].split("").reverse().join("");
      amounts.push({
        amount: parseFloat(amountStr.replace(/,/g, "")),
        currency: text.includes("$") ? "$" : "₪",
      });
    }

    return amounts;
  }

  static findHighestAmount(
    text: string,
    context: string = ""
  ): { amount: number; currency: string } | null {
    const amounts = this.extractAmounts(text);
    if (amounts.length === 0) return null;

    // מיון לפי גודל הסכום
    amounts.sort((a, b) => b.amount - a.amount);

    // אם יש הקשר של השתלות, נחפש את הסכום הגבוה ביותר
    if (context.includes("השתל")) {
      return amounts[0];
    }

    return amounts[0];
  }
}
