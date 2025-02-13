import React, { useState } from "react";
import { askQuestion } from "../api/actions";
import { FiSend, FiLoader } from "react-icons/fi";

const CoverageTable = ({ content }: { content: string }) => {
  // Parse the content into sections
  const sections = content
    .split("###")
    .filter(Boolean)
    .map((section) => section.trim());

  const renderTable = (tableContent: string) => {
    const rows = tableContent.split("\n").filter(Boolean);
    const [header, ...dataRows] = rows;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="bg-indigo-100">
              {header.split("|").map((cell, i) => (
                <th key={i} className="border border-gray-300 p-3 text-right">
                  {cell.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                {row.split("|").map((cell, j) => (
                  <td key={j} className="border border-gray-300 p-3 text-right">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-8" dir="rtl">
      {sections.map((section, index) => {
        const [title, ...content] = section.split("\n");
        const sectionContent = content.join("\n").trim();

        return (
          <div key={index} className="space-y-4">
            <h2 className="text-xl font-bold text-indigo-800">{title}</h2>
            {title.includes("טבלת") ? (
              renderTable(sectionContent)
            ) : (
              <div className="text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded">
                {sectionContent}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function QuestionForm() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await askQuestion(question);
      setAnswer(result);
    } catch (error) {
      console.error("Error fetching answer:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-4">
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
      </form>

      {loading && (
        <div className="text-center p-4">
          <FiLoader className="animate-spin mx-auto h-8 w-8 text-indigo-600" />
          <p className="mt-2 text-gray-600">מעבד את השאלה שלך...</p>
        </div>
      )}

      {answer && !loading && <CoverageTable content={answer} />}
    </div>
  );
}
