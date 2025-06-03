import { Button } from "@/components/ui/button";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ExcelExportProps {
  content: string;
  fileName?: string;
}

/**
 * פונקציה לייצוא תוכן השוואת פוליסות לקובץ אקסל
 * @param content התוכן בפורמט מרקדאון
 * @param fileName שם הקובץ (ברירת מחדל: השוואת_פוליסות_בריאות.xlsx)
 */
/**
 * פונקציה ליצירת מזהה ייחודי לסקציה
 */
const createSafeSheetName = (
  title: string,
  existingNames: Set<string>
): string => {
  // הסרת תווים לא חוקיים בשמות גיליונות אקסל
  let safeName = title.replace(/[\[\]\*\/\\?:]/g, "_");

  // הגבלת האורך ל-31 תווים (מקסימום באקסל)
  if (safeName.length > 27) {
    safeName = safeName.substring(0, 27);
  }

  // וידוא שהשם ייחודי
  let uniqueName = safeName;
  let counter = 1;

  while (existingNames.has(uniqueName.toLowerCase())) {
    uniqueName = `${safeName} ${counter}`;
    counter++;

    // אם עדיין מעל 31 תווים, קצר יותר את השם הבסיסי
    if (uniqueName.length > 31) {
      safeName = safeName.substring(0, 27 - String(counter).length - 1);
      uniqueName = `${safeName} ${counter}`;
    }
  }

  // הוסף לרשימת השמות הקיימים
  existingNames.add(uniqueName.toLowerCase());

  return uniqueName;
};

export const exportToExcel = async ({
  content,
  fileName = "השוואת_פוליסות_בריאות.xlsx",
}: ExcelExportProps) => {
  // מעקב אחר שמות גיליונות שכבר קיימים
  const existingSheetNames = new Set<string>();
  // יצירת workbook חדש
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "מערכת השוואת פוליסות";
  workbook.created = new Date();

  // פיצול לסקציות
  const sections = content
    .split(/(?=\n###|\n####)/)
    .map((section) => section.trim())
    .filter(Boolean);

  for (const section of sections) {
    // עיבוד כל סקציה
    if (!section) continue;

    const lines = section.split("\n").filter(Boolean);
    const titleLine = lines.find((line) => line.startsWith("###")) || lines[0];
    const title = titleLine.replace(/^#+\s*/, "").trim();
    const contentLines = lines.slice(lines.indexOf(titleLine) + 1);

    // יצירת שם גיליון בטוח וייחודי
    const safeSheetName = createSafeSheetName(title, existingSheetNames);

    // יצירת גיליון חדש עם השם הבטוח
    const worksheet = workbook.addWorksheet(safeSheetName, {
      properties: {
        tabColor: { argb: "FF6B77E8" },
        defaultRowHeight: 20,
      },
    });

    // הגדרת כיוון RTL לגיליון
    worksheet.views = [{ rightToLeft: true }];

    // בדיקה אם הסקציה מכילה טבלה
    if (contentLines.join("\n").includes("|")) {
      // עיבוד טבלה
      const tableRows = contentLines
        .filter((line) => line.includes("|"))
        .map((line) => line.trim())
        .filter((line) => !line.match(/^\|[\s-]+\|[\s-]+\|/)) // מסנן שורות מפרידות
        .map((line) =>
          line
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean)
        );

      if (tableRows.length > 0) {
        // הגדרת כותרות העמודות
        const headers = tableRows[0];

        // הוספת שורת כותרות
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true, size: 12 };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE6E6FA" }, // צבע רקע סגלגל בהיר
        };

        // הוספת שורות נתונים
        const dataRows = tableRows.slice(1);
        dataRows.forEach((row, index) => {
          const excelRow = worksheet.addRow(row);

          // צביעת שורות לסירוגין
          if (index % 2 === 0) {
            excelRow.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8F8F8" }, // צבע רקע אפור בהיר
            };
          }

          // הגדרת גבולות לתאים
          excelRow.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
            cell.alignment = { vertical: "middle", horizontal: "right" };
          });
        });

        // הגדרת גבולות לתאי כותרת
        headerRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "right" };
        });

        // התאמת רוחב עמודות
        worksheet.columns.forEach((column) => {
          column.width = 25; // רוחב סטנדרטי לכל העמודות
        });
      }
    } else {
      // טקסט חופשי - הוספה כפסקאות
      const cleanContent = contentLines
        .map((line) => line.replace(/^#+\s*/, "")) // מסיר סימוני מרקדאון נוספים
        .join("\n")
        .trim();

      // כותרת ראשית
      const titleRow = worksheet.addRow([title]);
      titleRow.font = { bold: true, size: 14, color: { argb: "FF4B0082" } }; // צבע אינדיגו
      worksheet.addRow([]); // שורה ריקה

      // פיצול לשורות והוספה לגיליון
      const textLines = cleanContent.split("\n");
      textLines.forEach((line) => {
        if (line.trim()) {
          const textRow = worksheet.addRow([line]);
          textRow.font = { size: 11 };
          textRow.alignment = {
            vertical: "middle",
            horizontal: "right",
            wrapText: true,
          };
        } else {
          worksheet.addRow([]); // שורה ריקה
        }
      });

      // התאמת רוחב עמודות לטקסט
      worksheet.getColumn(1).width = 80;
    }
  }

  // יצירת כריכה/עמוד ראשי (וידוא שם ייחודי)
  const summarySheetName = createSafeSheetName(
    "סיכום השוואה",
    existingSheetNames
  );
  const summarySheet = workbook.addWorksheet(summarySheetName, {
    properties: { tabColor: { argb: "FF4B0082" } },
  });
  summarySheet.views = [{ rightToLeft: true }];

  // כותרת ראשית בעמוד הסיכום
  const mainTitle = summarySheet.addRow(["השוואת פוליסות בריאות"]);
  mainTitle.font = { bold: true, size: 16, color: { argb: "FF4B0082" } };
  mainTitle.height = 30;
  summarySheet.mergeCells("A1:C1");

  // מידע נוסף
  summarySheet.addRow([]);
  const dateRow = summarySheet.addRow([
    "תאריך:",
    new Date().toLocaleDateString("he-IL"),
  ]);
  dateRow.font = { bold: true };

  summarySheet.addRow([]);
  const sectionsTitle = summarySheet.addRow(["סקציות בדוח:"]);
  sectionsTitle.font = { bold: true };

  // רשימת הסקציות
  sections.forEach((section, index) => {
    const lines = section.split("\n").filter(Boolean);
    const titleLine = lines.find((line) => line.startsWith("###")) || lines[0];
    const title = titleLine.replace(/^#+\s*/, "").trim();

    const sectionRow = summarySheet.addRow([`${index + 1}. ${title}`]);
    sectionRow.font = { color: { argb: "FF4B0082" } };
  });

  // התאמת רוחבים
  summarySheet.getColumn(1).width = 20;
  summarySheet.getColumn(2).width = 60;

  // מיון הגיליונות - סיכום תמיד ראשון
  workbook.eachSheet((worksheet, id) => {
    if (worksheet.name === summarySheetName) {
      // הגדרת סיכום כגיליון הראשון
      worksheet.orderNo = 0;
    } else {
      // שאר הגיליונות לפי סדר המקורי
      worksheet.orderNo = id;
    }
  });

  try {
    // שמירת הקובץ
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), fileName);
    return true;
  } catch (error) {
    console.error("שגיאה בשמירת קובץ אקסל:", error);
    throw new Error(`שגיאה בשמירת קובץ אקסל: ${error.message}`);
  }
};

/**
 * רכיב כפתור ייצוא לאקסל
 */
const ExcelExportButton = ({ content }: { content: string }) => {
  const handleExport = async () => {
    try {
      // בדיקה אם הספריות הנדרשות זמינות
      if (typeof ExcelJS === "undefined" || typeof saveAs === "undefined") {
        alert(
          "שגיאה: ספריות ExcelJS או FileSaver אינן מותקנות. יש להתקין אותן תחילה."
        );
        return;
      }

      // הצגת הודעת טעינה
      const loadingMsg = "מייצא נתונים לאקסל...";
      console.log(loadingMsg);

      // לאפשר לדפדפן לעדכן את התצוגה לפני עיבוד כבד
      setTimeout(async () => {
        try {
          await exportToExcel({ content });
          console.log("הייצוא הושלם בהצלחה");
        } catch (err) {
          console.error("שגיאה בייצוא לאקסל:", err);
          alert(`שגיאה בייצוא לאקסל: ${err.message || "שגיאה לא ידועה"}`);
        }
      }, 100);
    } catch (error) {
      console.error("שגיאה בייצוא לאקסל:", error);
      alert(`שגיאה בייצוא לאקסל: ${error.message || "שגיאה לא ידועה"}`);
    }
  };

  return (
    <Button
      onClick={handleExport}
      className="mt-4 bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center"
      dir="rtl"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
      </svg>
      ייצוא לאקסל
    </Button>
  );
};

export default ExcelExportButton;
