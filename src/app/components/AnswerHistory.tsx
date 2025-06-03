import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AnswerHistoryProps {
  history: { question: string; answer: string; timestamp: number }[];
  onSelectAnswer: (answer: string) => void;
}

export function AnswerHistory({ history, onSelectAnswer }: AnswerHistoryProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      <h2 className="text-xl font-bold mb-4 text-indigo-800">
        היסטוריית תשובות
      </h2>
      <ScrollArea className="h-[300px]">
        {history.map((item, index) => (
          <div key={index} className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="font-semibold mb-2">{item.question}</p>
            <p className="text-sm text-gray-600 mb-2">
              {new Date(item.timestamp).toLocaleString("he-IL")}
            </p>
            <Button
              onClick={() => onSelectAnswer(item.answer)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              הצג תשובה
            </Button>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
