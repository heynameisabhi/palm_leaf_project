"use client";

import { useState } from "react";
import axios from "axios";

const FolderPathInput: React.FC = () => {
  const [folderPath, setFolderPath] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!folderPath.trim()) {
      setError("Please enter a valid folder path.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/get-folder-details", {
        folder_path: folderPath,
      });

      console.log("Response:", response.data);
    } catch (err) {
      setError("Error fetching folder details.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-full max-w-md p-6 bg-opacity-10 backdrop-blur-md border border-green-500 rounded-lg">
        <h2 className="text-2xl font-bold text-green-400 text-center mb-4">Select a Folder</h2>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            type="text"
            placeholder="Paste the absolute folder path here..."
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            className="w-full p-3 bg-black bg-opacity-50 text-white border border-green-500 rounded-md focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          <button
            type="submit"
            className="mt-4 w-full p-3 bg-green-500 text-black font-semibold rounded-md transition duration-300 hover:bg-green-400 hover:shadow-lg"
          >
            Get Folder Details
          </button>
        </form>

        {error && <p className="text-red-400 text-center mt-3">{error}</p>}
      </div>
    </div>
  );
};

export default FolderPathInput;
