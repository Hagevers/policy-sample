export interface PolicyMetadata {
  issuer?: string;
  policyNumber?: string;
  validFrom?: string;
  validTo?: string;
}

export interface ProcessedChunk {
  text: string;
  section: string;
  metadata: {
    issuer?: string;
    policyNumber?: string;
    validFrom?: string;
    validTo?: string;
  };
}

export interface RelevantChunks {
  [filename: string]: ProcessedChunk[];
}

export class PolicyAnalyzer {
  private static readonly SECTION_MARKERS = {
    basic: [
      "רובד בסיס",
      "כיסויים בסיסיים",
      "פרק א",
      "השתלות",
      "תרופות",
      'ניתוחים בחו"ל',
      'טיפולים מיוחדים בחו"ל',
      'טיפולים מחליפי ניתוח בחו"ל',
      "תרופות מחוץ לסל הבריאות",
      'השתלות וטיפולים מיוחדים בחו"ל',
    ],
    extended: [
      "רובד הרחבה",
      "כיסויים נוספים",
      "פרק ב",
      "אמבולטורי",
      "ניתוחים בארץ",
      "אבחון מהיר",
      "סיעוד",
      "כתבי שירות",
    ],
    terms: ["תנאים כלליים", "חריגים", "סייגים", "תקופת אכשרה", "תקופת המתנה"],
    pricing: [
      "דמי ביטוח",
      "פרמיה",
      "תעריף",
      "מימון מעסיק",
      "פרמיות נוספות",
      "עלות הביטוח",
      "דמי הביטוח",
    ],
  };

  static processChunks(chunks: string[]): ProcessedChunk[] {
    return chunks.map((chunk) => {
      const metadata = this.extractMetadata(chunk);
      const section = this.classifySection(chunk);
      return {
        text: chunk,
        section,
        metadata,
      };
    });
  }

  private static extractMetadata(text: string): PolicyMetadata {
    const metadata: PolicyMetadata = {};

    // Extract issuer
    const issuerMatch =
      text.match(/חברת\s*הביטוח:?\s*([^\n.]+)/i) ||
      text.match(/מבטח:?\s*([^\n.]+)/i);
    if (issuerMatch) {
      metadata.issuer = issuerMatch[1].trim();
    }

    // Extract policy number
    const policyMatch = text.match(/מספר\s*פוליסה:?\s*([^\n.]+)/i);
    if (policyMatch) {
      metadata.policyNumber = policyMatch[1].trim();
    }

    // Extract validity period
    const dateMatch = text.match(/תקופת\s*הביטוח:?\s*([^\n]+)/i);
    if (dateMatch) {
      const dates = dateMatch[1].split(/\s*-\s*/);
      if (dates.length === 2) {
        metadata.validFrom = dates[0].trim();
        metadata.validTo = dates[1].trim();
      }
    }

    return metadata;
  }

  private static classifySection(text: string): string {
    for (const [section, markers] of Object.entries(this.SECTION_MARKERS)) {
      if (
        markers.some((marker) =>
          text.toLowerCase().includes(marker.toLowerCase())
        )
      ) {
        return section;
      }
    }
    return "other";
  }

  static generateSystemContext(): string {
    return `
אתה מומחה לניתוח פוליסות ביטוח בריאות. אתה מכיר היטב:
1. את המבנה הסטנדרטי של פוליסות בריאות קבוצתיות
2. את הכיסויים הנפוצים ברובד הבסיס וההרחבה
3. את המונחים המקצועיים בתחום
4. את הרגולציה והנוסח האחיד בניתוחים

בהשוואה בין פוליסות:
1. יש לשים דגש על הבדלים בסכומי ביטוח, תקרות והשתתפויות עצמיות
2. יש לזהות כיסויים שקיימים בפוליסה אחת ולא בשנייה
3. יש להתייחס להבדלים בתנאי הזכאות ובחריגים
4. יש לציין במפורש "לא קיים" כאשר כיסוי מופיע רק באחת הפוליסות
`;
  }

  static organizeContext(relevantChunks: {
    [filename: string]: ProcessedChunk[];
  }): string {
    return Object.entries(relevantChunks)
      .map(([filename, chunks]) => {
        const metadata = chunks[0]?.metadata || {};

        const sections = {
          basic: chunks.filter((c) => c.section === "basic"),
          extended: chunks.filter((c) => c.section === "extended"),
          terms: chunks.filter((c) => c.section === "terms"),
          pricing: chunks.filter((c) => c.section === "pricing"),
          other: chunks.filter((c) => c.section === "other"),
        };

        return `
מסמך פוליסה: ${filename}
מבטח: ${metadata.issuer || "לא צוין"}
מספר פוליסה: ${metadata.policyNumber || "לא צוין"}
תקופת ביטוח: ${metadata.validFrom || "לא צוין"} - ${
          metadata.validTo || "לא צוין"
        }

=== רובד בסיס ===
${sections.basic.map((c) => c.text).join("\n")}

=== רובד הרחבה ===
${sections.extended.map((c) => c.text).join("\n")}

=== תנאים וחריגים ===
${sections.terms.map((c) => c.text).join("\n")}

=== תעריפים ומימון ===
${sections.pricing.map((c) => c.text).join("\n")}

=== מידע נוסף ===
${sections.other.map((c) => c.text).join("\n")}
`;
      })
      .join("\n\n==========\n\n");
  }
}
