"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ComparisonType = "compare" | "difference" | "QNA";
export type DocumentCount = "2" | "3" | "4" | "all";

interface FloatingComparisonOptionsProps {
  onOptionsChange: (type: ComparisonType, count: DocumentCount) => void;
}

export function FloatingComparisonOptions({
  onOptionsChange,
}: FloatingComparisonOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [comparisonType, setComparisonType] =
    useState<ComparisonType>("compare");
  const [documentCount, setDocumentCount] = useState<DocumentCount>("2");

  const handleTypeChange = (value: ComparisonType) => {
    setComparisonType(value);
    onOptionsChange(value, documentCount);
  };

  const handleCountChange = (value: DocumentCount) => {
    setDocumentCount(value);
    onOptionsChange(comparisonType, value);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 rounded-full w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
      >
        <Settings size={24} />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-20 left-4 bg-white rounded-lg shadow-xl p-6 w-80 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                אפשרויות השוואה
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X size={24} />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  סוג השוואה
                </h3>
                <RadioGroup
                  value={comparisonType}
                  onValueChange={(value) =>
                    handleTypeChange(value as ComparisonType)
                  }
                  className="flex flex-col space-y-2"
                  dir="rtl"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="compare"
                      id="compare"
                      className="text-purple-600"
                    />
                    <Label htmlFor="compare">השוואת פוליסות</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="difference"
                      id="difference"
                      className="text-purple-600"
                    />
                    <Label htmlFor="difference">בדיקת שינויים בקובץ</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="QNA"
                      id="QNA"
                      className="text-purple-600"
                    />
                    <Label htmlFor="QNA">Q&A</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  מספר מסמכים
                </h3>
                <Select
                  value={documentCount}
                  onValueChange={(value) =>
                    handleCountChange(value as DocumentCount)
                  }
                >
                  <SelectTrigger className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                    <SelectValue placeholder="Select number of documents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Documents</SelectItem>
                    <SelectItem value="3">3 Documents</SelectItem>
                    <SelectItem value="4">4 Documents</SelectItem>
                    <SelectItem value="all">All Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
