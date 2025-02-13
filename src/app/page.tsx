"use client";

import { useState } from "react";
import FileUpload from "./components/FileUpload";
import QuestionForm from "./components/QuestionForm";
import SavedFiles from "./components/SaveFiles";

export default function Home() {
  const [refreshFiles, setRefreshFiles] = useState(0);

  const handleUploadComplete = () => {
    setRefreshFiles((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <main className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full space-y-8">
        <h1 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          PDF Comparison RAG App
        </h1>
        <FileUpload onUploadComplete={handleUploadComplete} />
        <SavedFiles key={refreshFiles} />
        <QuestionForm />
      </main>
    </div>
  );
}
