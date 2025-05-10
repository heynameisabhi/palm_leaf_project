"use client";

import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { 
  Loader2, 
  Upload, 
  File, 
  Check, 
  AlertCircle, 
  Folder,
  HardDrive,
  FolderOpen,
  Search,
  FileSpreadsheet
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Progress } from "@/components/ui/Progress";
import { toast } from "sonner";
import Link from "next/link";

const BulkInsertionPage = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [folderPath, setFolderPath] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Dropzone for CSV file
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setCsvFile(file);
        setError("");
      } else {
        setError("Please upload a valid CSV file");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  // Reset the form
  const resetForm = () => {
    setCsvFile(null);
    setFolderPath("");
    setError("");
    setSuccess(false);
    setProgress(0);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      setError("Please upload a CSV file");
      return;
    }

    if (!folderPath.trim()) {
      setError("Please enter a valid folder path");
      return;
    }

    setError("");
    setIsSubmitting(true);
    setProgress(10);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("csvFile", csvFile);
      formData.append("foldersBasePath", folderPath);

      // Simulating progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 500);

      // Send the request
      const response = await axios.post("/api/bulk-insertion", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setSuccess(true);

      toast.success(`Bulk insertion completed. ${response.data.items_processed || 0} items processed.`);
    } catch (error: any) {
      console.error("Error during bulk insertion:", error);
      
      setError(
        error.response?.data?.error || 
        "An error occurred during bulk insertion. Please try again."
      );
      
      toast.error(error.response?.data?.error || "Bulk insertion failed");
      setProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-tl from-zinc-950 via-black/30 to-emerald-950/80 p-3">
      <Card className="w-full max-w-3xl border-[#1a1a1a] bg-black shadow-xl backdrop-blur-md">
        <CardHeader className="border-b border-[#1a1a1a] bg-black">
          <CardTitle className="text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-400" />
            Bulk Data Insertion
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload a CSV file and specify the folder path to insert multiple granthas at once
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CSV File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Upload CSV File
              </label>
              
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragActive 
                    ? "border-green-500 bg-green-500/10" 
                    : csvFile 
                      ? "border-green-400 bg-green-400/5" 
                      : "border-gray-700 hover:border-gray-500"
                  }`}
              >
                <input {...getInputProps()} />
                
                <div className="flex flex-col items-center justify-center gap-2">
                  {csvFile ? (
                    <>
                      <Check className="h-10 w-10 text-green-400" />
                      <p className="text-green-400 font-medium">{csvFile.name}</p>
                      <p className="text-xs text-gray-400">
                        {(csvFile.size / 1024).toFixed(2)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-gray-400" />
                      <p className="text-gray-400">
                        {isDragActive
                          ? "Drop the CSV file here"
                          : "Drag and drop a CSV file, or click to browse"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Supported format: .csv
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Folder Path Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Folders Base Path
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FolderOpen className="h-4 w-4 text-gray-500" />
                </div>
                <Input
                  type="text"
                  placeholder="Enter the base path containing the folders..."
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="pl-10 bg-[#121212] border-[#1a1a1a] text-white focus:ring-green-500 focus:border-green-500"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray-500">
                This should be the directory that contains all the folders mentioned in your CSV
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Progress */}
            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Processing...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="bg-green-900/20 border-green-800">
                <Check className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Bulk insertion completed successfully.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
                className="text-white border-none bg-zinc-800 cursor-pointer"
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !csvFile || !folderPath.trim()}
                className="bg-green-600 hover:bg-green-700 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process and Insert
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="border-t border-[#1a1a1a] bg-black/50 flex justify-between">
          <div className="text-xs text-gray-500">
            Make sure your CSV file follows the required format.
          </div>
          <Link 
            href="/dashboard/data/insert" 
            className="text-xs text-green-400 hover:text-green-300 hover:underline"
          >
            Back to Data Insertion
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BulkInsertionPage; 