"use client";

import { useState, useEffect } from "react";
import { FiFile, FiTrash2 } from "react-icons/fi";

interface SavedFile {
  name: string;
  path: string;
}

export default function SavedFiles() {
  const [files, setFiles] = useState<SavedFile[]>([]);

  useEffect(() => {
    fetchSavedFiles();
  }, []);

  const fetchSavedFiles = async () => {
    const response = await fetch("/api/files");
    if (response.ok) {
      const data = await response.json();
      setFiles(data);
    }
  };

  const handleDelete = async (filePath: string) => {
    const response = await fetch("/api/files", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filePath }),
    });

    if (response.ok) {
      fetchSavedFiles();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 rtl">
      <h2 className="text-2xl font-semibold mb-4">קבצים שמורים</h2>
      {files.length === 0 ? (
        <p className="text-gray-500">לא הועלו קבצים</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.path}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
            >
              <span className="flex items-center">
                <FiFile className="ml-2 text-indigo-600" />
                {file.name}
              </span>
              <button
                onClick={() => handleDelete(file.path)}
                className="text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <FiTrash2 />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
