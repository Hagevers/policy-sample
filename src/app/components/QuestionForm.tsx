"use client";
import pdfMake from "pdfmake/build/pdfmake";
// import pdfFonts from "@/../../build/vfs_fonts";
import type React from "react";
import { useState, useEffect } from "react";
import {
  handlePolicyComparison,
  // ,
  // compareInsurancePoliciesWithClaude,
} from "../api/actions";
import { FiSend, FiLoader, FiDownload } from "react-icons/fi";
import type { ComparisonType, DocumentCount } from "./Comparision-Options";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
import "jspdf-autotable";
import { AnswerHistory } from "./AnswerHistory";
import ExcelExportButton from "../utils/excel-download";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { generatePDF } from "../utils/generate-pdf";

const CoverageTable = ({ content }: { content: string }) => {
  console.log("Content:", content);

  // פונקציה לניקוי שורות הטבלה
  const cleanTableRows = (tableContent: string) => {
    const rows = tableContent
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row && row.includes("|")) // מסנן שורות ריקות ושורות ללא |
      .map((row) => {
        // מסיר את סימני ה-markdown מהכותרת
        if (row.includes("---")) return null;
        return row
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);
      })
      .filter((row) => row !== null) as string[][];

    return rows;
  };

  // פונקציה לעיבוד סקציה
  const processSectionContent = (content: string) => {
    // מסיר כותרות שמתחילות ב-# אבל משאיר את התוכן שלהן
    return content
      .split("\n")
      .map((line) => {
        if (line.trim().startsWith("#")) {
          return line.replace(/^#+\s*/, "");
        }
        return line;
      })
      .join("\n");
  };

  const renderTable = (tableContent: string) => {
    console.log("Table Content:", tableContent);
    const rows = cleanTableRows(tableContent);
    if (rows.length === 0) return null;

    const [header, ...dataRows] = rows;

    return (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="bg-indigo-100">
              {header.map((cell, i) => (
                <th
                  key={i}
                  className="border border-gray-300 p-3 text-right font-bold"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, i) => {
              return (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="border border-gray-300 p-3 text-right"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // פיצול לסקציות
  const sections = content
    .split(/(?=\n###|\n####)/) // מזהה רק כותרות שמתחילות עם ###
    .map((section) => section.trim())
    .filter(Boolean);

  const renderSection = (section: string) => {
    if (!section) return null;

    const lines = section.split("\n").filter(Boolean);
    const titleLine = lines.find((line) => line.startsWith("###")) || lines[0];
    const title = titleLine.replace(/^#+\s*/, "").trim();
    const contentLines = lines.slice(lines.indexOf(titleLine) + 1);

    const sectionContent = processSectionContent(
      contentLines.join("\n")
    ).trim();

    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold text-indigo-800 mb-4">{title}</h2>
        {sectionContent.includes("|") ? (
          renderTable(sectionContent)
        ) : (
          <div className="text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded">
            {sectionContent}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8" dir="rtl">
      {sections.map((section, index) => (
        <div key={index}>{renderSection(section)}</div>
      ))}
    </div>
  );
};

interface QuestionFormProps {
  comparisonType: ComparisonType;
  documentCount: DocumentCount;
}

export default function QuestionForm({ comparisonType }: QuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    { question: string; answer: string; timestamp: number }[]
  >([]);

  const [pdf, setPdf] = useState<string>("");

  useEffect(() => {
    const savedHistory = localStorage.getItem("answerHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (question: string, answer: string) => {
    const newHistory = [
      { question, answer, timestamp: Date.now() },
      ...history,
    ].slice(0, 10); // Keep only the last 10 items
    setHistory(newHistory);
    localStorage.setItem("answerHistory", JSON.stringify(newHistory));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await handlePolicyComparison();
      // const result = await compareInsurancePoliciesWithClaude();
      setAnswer(result);
      saveToHistory(question, result);
    } catch (error) {
      console.error("Error fetching answer:", error);
    } finally {
      setLoading(false);
    }
  };

  // const cleanTableRows = (tableContent: string) => {
  //   const rows = tableContent
  //     .split("\n")
  //     .map((row) => row.trim())
  //     .filter((row) => row && row.includes("|"))
  //     .map((row) => {
  //       if (row.includes("---")) return null;
  //       return row
  //         .split("|")
  //         .map((cell) => cell.trim())
  //         .filter(Boolean);
  //     })
  //     .filter((row) => row !== null) as string[][];

  //   return rows;
  // };

  const downloadExcel = (): void => {
    if (!answer) return;

    try {
      // יצירת workbook חדש
      const workbook = XLSX.utils.book_new();

      // יצירת גיליון חדש
      const worksheet = XLSX.utils.aoa_to_sheet([]);

      // עיבוד המידע למבנה אקסל
      const { rows, merges } = processMarkdownForExcel(answer);

      // הוספת השורות לגיליון
      XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A1" });

      // הוספת המיזוגים
      worksheet["!merges"] = merges;

      // הגדרת רוחב עמודות
      const maxColumns = Math.max(...rows.map((row) => row.length), 6);
      worksheet["!cols"] = Array(maxColumns).fill({ wch: 84, wpx: 508 });

      // הגדרת גובה שורות
      worksheet["!rows"] = Array(rows.length).fill({ hpt: 15.6, hpx: 15.6 });

      // הגדרת כיוון גיליון RTL
      if (!worksheet["!sheetPr"]) worksheet["!sheetPr"] = {};
      worksheet["!sheetPr"].rightToLeft = true;

      // עיצוב התאים
      applyStyles(worksheet, rows);

      // הוספת הגיליון ל-workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "השוואת פוליסות");

      // שמירת הקובץ
      XLSX.writeFile(workbook, "policy_comparison.xlsx");
    } catch (error) {
      console.error("שגיאה ביצירת קובץ אקסל:", error);
    }
  };

  /**
   * עיבוד מסמך Markdown לשורות אקסל ומיזוגים
   * תואם את תהליך העיבוד בקומפוננטת ה-React
   */
  function processMarkdownForExcel(markdown: string): {
    rows: string[][];
    merges: XLSX.Range[];
  } {
    const rows: string[][] = [];
    const merges: XLSX.Range[] = [];
    let rowIndex = 0;

    // הוספת כותרת ראשית (אם קיימת)
    const mainTitleMatch = markdown.match(/^# (.*)/m);
    if (mainTitleMatch) {
      rows.push([mainTitleMatch[1]]);
      merges.push({
        s: { r: rowIndex, c: 0 },
        e: { r: rowIndex, c: 5 },
      });
      rowIndex++;
      rows.push([]); // שורה ריקה אחרי כותרת ראשית
      rowIndex++;
    }

    // פיצול לסקציות (בדיוק כמו בקוד הקומפוננטה)
    const sections = markdown
      .split(/(?=\n###|\n####)/)
      .map((section) => section.trim())
      .filter(Boolean);

    // עיבוד כל סקציה
    sections.forEach((section) => {
      const lines = section.split("\n").filter(Boolean);
      if (lines.length === 0) return;

      const titleLine =
        lines.find((line) => line.startsWith("###")) || lines[0];
      const title = titleLine.replace(/^#+\s*/, "").trim();
      const contentLines = lines.slice(lines.indexOf(titleLine) + 1);

      // עיבוד תוכן הסקציה, בדומה ל-processSectionContent
      const sectionContent = contentLines
        .map((line) => {
          if (line.trim().startsWith("#")) {
            return line.replace(/^#+\s*/, "");
          }
          return line;
        })
        .join("\n")
        .trim();

      // הוספת כותרת הסקציה
      rows.push([title]);
      merges.push({
        s: { r: rowIndex, c: 0 },
        e: { r: rowIndex, c: 5 },
      });
      rowIndex++;

      // הוספת שורה ריקה אחרי הכותרת
      rows.push([]);
      rowIndex++;

      // בדיקה אם התוכן הוא טבלה
      if (sectionContent.includes("|")) {
        // עיבוד טבלה בדומה ל-cleanTableRows
        const tableRows = cleanTableRows(sectionContent);
        if (tableRows.length > 0) {
          tableRows.forEach((tableRow) => {
            rows.push(tableRow);
            rowIndex++;
          });

          // הוספת שורה ריקה אחרי הטבלה
          rows.push([]);
          rowIndex++;
        }
      } else if (sectionContent.trim()) {
        // תוכן רגיל - פיצול לשורות
        const contentLines = sectionContent.split("\n");
        contentLines.forEach((line) => {
          rows.push([line]);
          rowIndex++;
        });

        // הוספת שורה ריקה אחרי התוכן
        rows.push([]);
        rowIndex++;
      }
    });

    return { rows, merges };
  }

  /**
   * ניקוי שורות טבלה מסימני Markdown
   * תואם את הפונקציה בקומפוננטת ה-React
   */
  function cleanTableRows(tableContent: string): string[][] {
    const rows = tableContent
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row && row.includes("|")) // מסנן שורות ריקות ושורות ללא |
      .map((row) => {
        // מסיר את סימני ה-markdown מהכותרת
        if (row.includes("---")) return null;
        return row
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean);
      })
      .filter((row): row is string[] => row !== null);

    return rows;
  }

  /**
   * החלת סגנונות על התאים של הגיליון
   */
  function applyStyles(worksheet: XLSX.WorkSheet, rows: string[][]): void {
    if (!worksheet["!ref"]) return;

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    // בדיקה אם שורה היא כותרת טבלה
    const isTableHeader = (rowIndex: number): boolean | undefined => {
      if (rowIndex <= 0 || rowIndex >= rows.length - 1) return false;

      // בדיקה האם השורה הקודמת ריקה או כותרת ממוזגת
      const isPreviousRowEmptyOrTitle =
        !rows[rowIndex - 1] ||
        rows[rowIndex - 1].length === 0 ||
        (rows[rowIndex - 1].length === 1 &&
          worksheet["!merges"]?.some(
            (m) => m.s.r === rowIndex - 1 && m.s.c === 0
          ));

      // בדיקה האם השורה הנוכחית מכילה לפחות 3 תאים (סימן לטבלה)
      const hasMultipleColumns = rows[rowIndex].length >= 3;

      // בדיקה האם השורה הבאה מכילה גם תאים מרובים (סימן לטבלה)
      const nextRowHasMultipleColumns =
        rowIndex < rows.length - 1 && rows[rowIndex + 1].length >= 3;

      return (
        isPreviousRowEmptyOrTitle &&
        hasMultipleColumns &&
        nextRowHasMultipleColumns
      );
    };

    // מעבר על כל התאים בגיליון
    for (let r = range.s.r; r <= range.e.r; ++r) {
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        if (!worksheet[cellAddress]) continue;

        const cell = worksheet[cellAddress];

        // סגנון בסיסי לכל התאים
        cell.s = {
          font: { name: "Arial", sz: 11 },
          alignment: {
            vertical: "center",
            horizontal: "right",
            wrapText: true,
          },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // זיהוי אם התא הוא חלק מכותרת ממוזגת
        const isMergedTitle = worksheet["!merges"]?.some(
          (m) => r === m.s.r && c === m.s.c && m.e.c > m.s.c
        );

        // זיהוי אם התא הוא חלק מכותרת טבלה
        const isHeaderCell = isTableHeader(r) && c < rows[r].length;

        // עיצוב לכותרות ממוזגות
        if (isMergedTitle) {
          cell.s.font.bold = true;
          cell.s.font.sz = r === 0 ? 16 : 14; // כותרת ראשית או משנית
          cell.s.fill = { fgColor: { rgb: "E6E6FA" } }; // רקע סגלגל בהיר
          cell.s.alignment.horizontal = "center";
        }
        // עיצוב לכותרות טבלה
        else if (isHeaderCell) {
          cell.s.font.bold = true;
          cell.s.fill = { fgColor: { rgb: "F0F0F8" } }; // רקע אפור-כחלחל
          cell.s.alignment.horizontal = "center";
        }
      }
    }
  }

  // const fixNumbersInRTLText = (text: string) => {
  //   // Check if the entire string contains only numbers, currency symbols, and punctuation
  //   const isOnlyNumbers = /^[\d.,₪$ ]+$/.test(text.trim());

  //   if (isOnlyNumbers) {
  //     return text.split("").reverse().join(""); // Reverse only pure numbers & symbols
  //   }

  //   return text; // Leave text unchanged if it contains Hebrew letters
  // };

  // const fixTableData = (table: string[][]) => {
  //   return table.map((row) => row.map((cell) => fixNumbersInRTLText(cell)));
  // };

  // const downloadPDF = () => {
  //   if (!answer) return;

  //   const sections = answer.split(/(?=\n###|\n####)/).filter(Boolean);
  //   const pdf = new jsPDF({
  //     orientation: "p",
  //     unit: "mm",
  //     format: "a4",
  //   });

  //   pdf.addFont("/fonts/VarelaRound-Regular.ttf", "Varela", "normal");
  //   pdf.setFont("Varela");
  //   pdf.setFontSize(12);
  //   pdf.setLanguage("he");
  //   pdf.setR2L(true);

  //   let yOffset = 10;

  //   sections.forEach((section) => {
  //     const lines = section.split("\n").filter(Boolean);
  //     const title = lines[0].replace(/^#+\s*/, "").trim();
  //     const content = lines.slice(1).join("\n");

  //     // Add section title
  //     pdf.setFontSize(16);
  //     pdf.setTextColor(75, 0, 130); // Indigo color
  //     const fixedTitle = fixNumbersInRTLText(title);
  //     pdf.text(fixedTitle, pdf.internal.pageSize.width - 10, yOffset, {
  //       align: "right",
  //     });
  //     // pdf.text(title, pdf.internal.pageSize.width - 10, yOffset, {
  //     //   align: "right",
  //     // });
  //     yOffset += 10;

  //     if (content.includes("|")) {
  //       // Table content
  //       const rows = cleanTableRows(content);
  //       const [header, ...dataRows] = rows;

  //       const fixedHeader = fixTableData([header])[0];
  //       const fixedBody = fixTableData(dataRows);
  //       (pdf as jsPDF).autoTable({
  //         head: [fixedHeader],
  //         body: fixedBody,
  //         startY: yOffset,
  //         theme: "grid",
  //         styles: {
  //           font: "Varela",
  //           fontSize: 10,
  //           cellPadding: 3,
  //           halign: "right",
  //           valign: "middle",
  //           lineColor: [200, 200, 200],
  //           lineWidth: 0.1,
  //         },
  //         headStyles: {
  //           fillColor: [240, 240, 248],
  //           textColor: 0,
  //           fontStyle: "bold",
  //         },
  //         alternateRowStyles: {
  //           fillColor: [248, 248, 248],
  //         },
  //         margin: { right: 10 },
  //       });

  //       yOffset = (pdf as any).lastAutoTable.finalY + 10;
  //     } else {
  //       // Text content
  //       pdf.setFontSize(11);
  //       pdf.setTextColor(0);
  //       const contentLines = content.split("\n");

  //       const fixedContentLines = contentLines.map(fixNumbersInRTLText);
  //       fixedContentLines.forEach((line) => {
  //         pdf.text(line, pdf.internal.pageSize.width - 10, yOffset, {
  //           align: "right",
  //         });
  //         yOffset += 6;
  //       });
  //       // contentLines.forEach((line) => {
  //       //   pdf.text(line, pdf.internal.pageSize.width - 10, yOffset, {
  //       //     align: "right",
  //       //   });
  //       //   yOffset += 6;
  //       // });
  //     }

  //     // Add space after each section
  //     yOffset += 10;

  //     // Check if we need a new page
  //     if (yOffset > pdf.internal.pageSize.height - 20) {
  //       pdf.addPage();
  //       yOffset = 10;
  //     }
  //   });

  //   pdf.save("policy_comparison.pdf");
  // };

  const downloadPDF2 = async () => {
    if (!answer) return;

    const filePath = await generatePDF(answer);
    setPdf(filePath);
    return filePath;
    const sections = answer.split(/(?=\n###|\n####)/).filter(Boolean);
    const docDefinition: TDocumentDefinitions = {
      content: [],
      defaultStyle: {
        font: "Varela",
        // alignment: "right",
      },
      // language: "he",
    };

    sections.forEach((section) => {
      const lines = section.split("\n").filter(Boolean);
      const title = lines[0].replace(/^#+\s*/, "").trim();
      const content = lines.slice(1).join("\n");

      // כותרת
      docDefinition.content.push({
        text: title,
        fontSize: 16,
        bold: true,
        color: "#4B0082",
        margin: [0, 0, 0, 10],
      });

      if (content.includes("|")) {
        // טבלה
        const rows = cleanTableRows(content);
        const [header, ...dataRows] = rows;
        docDefinition.content.push({
          table: {
            headerRows: 1,
            widths: Array(header.length).fill("auto"),
            body: [
              header.map((cell) => ({ text: cell, bold: true })),
              ...dataRows,
            ],
          },
          layout: {
            fillColor: (rowIndex: number) =>
              rowIndex === 0
                ? "#F0F0F8"
                : rowIndex % 2 === 0
                ? "#F8F8F8"
                : null,
            hLineColor: () => "#C8C8C8",
            vLineColor: () => "#C8C8C8",
          },
        });
      } else {
        // טקסט רגיל
        docDefinition.content.push({
          text: content,
          fontSize: 11,
          margin: [0, 0, 0, 10],
        });
      }
    });

    pdfMake.createPdf(docDefinition).download("policy_comparison.pdf");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {comparisonType === "compare" ? (
          loading ? (
            <FiLoader className="animate-spin" />
          ) : (
            <Button
              className="w-full bg-indigo-400 text-white font-bold"
              variant={"outline"}
              type="submit"
            >
              התחל השוואה
            </Button>
          )
        ) : comparisonType === "difference" ? (
          loading ? (
            <FiLoader className="animate-spin" />
          ) : (
            <Button
              className="w-full bg-indigo-400 text-white font-bold"
              variant={"outline"}
            >
              בדוק שינויים
            </Button>
          )
        ) : (
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="שאל שאלה על הפוליסות..."
              className="w-full p-4 pl-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-right min-h-[100px] resize-y"
            />
            <button
              type="submit"
              disabled={loading || question.trim() === ""}
              className={`absolute left-2 top-2 p-2 rounded-lg transition-colors duration-200 ${
                loading || question.trim() === ""
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiSend />}
            </button>
          </div>
        )}
      </form>

      {loading && (
        <div className="text-center p-4">
          <FiLoader className="animate-spin mx-auto h-8 w-8 text-indigo-600" />
          <p className="mt-2 text-gray-600">מעבד את השאלה שלך...</p>
        </div>
      )}

      {answer && !loading && <CoverageTable content={answer} />}
      {answer && !loading && (
        <div className="flex flex-row-reverse gap-2 justify-end">
          <a href={pdf} onClick={downloadPDF2} download>
            <Button
              // onClick={downloadPDF2}
              className="mt-4 bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center"
            >
              <FiDownload className="mr-2" />
              הורד ל-PDF
            </Button>
          </a>
          <ExcelExportButton content={answer} />
          <Button
            onClick={downloadExcel}
            className="mt-4 bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center"
          >
            <FiDownload className="mr-2" />
            הורד לאקסל
          </Button>
        </div>
      )}

      <AnswerHistory
        history={history}
        onSelectAnswer={(selectedAnswer) => setAnswer(selectedAnswer)}
      />
    </div>
  );
}
