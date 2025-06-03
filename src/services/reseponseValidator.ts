import { AmountExtractor } from "./amountExtractor";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  correctedResponse?: string;
}

export class ResponseValidator {
  static validate(response: string, originalText: string): ValidationResult {
    const errors: string[] = [];
    let correctedResponse = response;

    // חילוץ כל הסכומים מהטקסט המקורי
    const amountsInOriginal = AmountExtractor.extractAmounts(originalText);

    // חיפוש סעיפי השתלות בטקסט המקורי
    const transplantSections = originalText
      .split("\n")
      .filter((line) => line.includes("השתל"));

    if (response.includes("השתלות") && transplantSections.length > 0) {
      // מציאת הסכום הגבוה ביותר להשתלות בטקסט המקורי
      const transplantAmounts = transplantSections
        .map((section) => AmountExtractor.extractAmounts(section))
        .flat()
        .sort((a, b) => {
          // המרה לשקלים לצורך השוואה
          const aInShekels = a.currency === "$" ? a.amount * 3.5 : a.amount;
          const bInShekels = b.currency === "$" ? b.amount * 3.5 : b.amount;
          return bInShekels - aInShekels;
        });

      if (transplantAmounts.length > 0) {
        const highestTransplantAmount = transplantAmounts[0];
        const amountsInResponse = AmountExtractor.extractAmounts(
          response.split("\n").find((line) => line.includes("השתלות")) || ""
        );

        // בדיקה אם הסכום הנכון מופיע בתשובה
        const hasCorrectAmount = amountsInResponse.some((amount) => {
          if (amount.currency === highestTransplantAmount.currency) {
            return amount.amount === highestTransplantAmount.amount;
          } else {
            // השוואה לאחר המרה לשקלים
            const amountInShekels =
              amount.currency === "$" ? amount.amount * 3.5 : amount.amount;
            const highestInShekels =
              highestTransplantAmount.currency === "$"
                ? highestTransplantAmount.amount * 3.5
                : highestTransplantAmount.amount;
            return Math.abs(amountInShekels - highestInShekels) < 0.01;
          }
        });

        if (!hasCorrectAmount) {
          errors.push(
            `סכום השתלות שגוי: נמצא סכום של ${highestTransplantAmount.amount.toLocaleString()}` +
              `${highestTransplantAmount.currency} במסמך המקורי`
          );

          // החלפת השורה הרלוונטית בתשובה
          const responseLines = correctedResponse.split("\n");
          const transplantLineIndex = responseLines.findIndex(
            (line) => line.includes("השתלות") && line.includes("|")
          );

          if (transplantLineIndex !== -1) {
            const [coverage, ...rest] =
              responseLines[transplantLineIndex].split("|");
            responseLines[transplantLineIndex] =
              `${coverage}| שיפוי מלא עם נותן שירות בהסכם, ` +
              `עד ${highestTransplantAmount.amount.toLocaleString()}` +
              `${highestTransplantAmount.currency} עם נותן שירות אחר |${
                rest[1] || ""
              }`;

            correctedResponse = responseLines.join("\n");
          }
        }
      }

      // בדיקת סכומים נוספים
      amountsInOriginal.forEach((originalAmount) => {
        if (originalAmount.amount > 1000000) {
          // בדיקת סכומים גדולים במיוחד
          const amountsInResponse = AmountExtractor.extractAmounts(response);
          const hasAmount = amountsInResponse.some(
            (responseAmount) =>
              responseAmount.amount === originalAmount.amount &&
              responseAmount.currency === originalAmount.currency
          );

          if (!hasAmount) {
            errors.push(
              `נמצא סכום משמעותי שלא הוזכר בתשובה: ` +
                `${originalAmount.amount.toLocaleString()}${
                  originalAmount.currency
                }`
            );
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      correctedResponse: errors.length > 0 ? correctedResponse : undefined,
    };
  }
}
