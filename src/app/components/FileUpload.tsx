"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FiUploadCloud, FiFile, FiX } from "react-icons/fi";

export default function FileUpload({
  onUploadComplete,
}: {
  onUploadComplete: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
  });

  const handleUpload = async () => {
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log(`File ${file.name} uploaded successfully`);
      } else {
        console.error(`Failed to upload file ${file.name}`);
      }
    }
    setUploading(false);
    setFiles([]);
    onUploadComplete();
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? "border-indigo-600 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400"
        }`}
      >
        <input {...getInputProps()} />
        <FiUploadCloud className="mx-auto text-4xl text-indigo-600 mb-4" />
        <p className="text-gray-600">
          Drag & drop PDF files here, or click to select files
        </p>
      </div>
      {files.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Selected Files:</h3>
          <ul className="space-y-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center justify-between bg-white p-2 rounded"
              >
                <span className="flex items-center">
                  <FiFile className="mr-2 text-indigo-600" />
                  {file.name}
                </span>
                <button
                  onClick={() => setFiles(files.filter((f) => f !== file))}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiX />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-colors duration-200 ${
          files.length === 0 || uploading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {uploading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Uploading...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <FiUploadCloud className="mr-2" />
            Upload PDFs
          </span>
        )}
      </button>
    </div>
  );
}
