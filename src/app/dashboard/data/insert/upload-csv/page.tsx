"use client"

import type React from "react"
import { useState, useCallback } from "react"
import axios from "axios"
import { toast } from "sonner"
import { Upload, FileUp, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

export default function CsvUploader() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(event.target.files)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(e.dataTransfer.files)
    }
  }, [])

  const removeFile = (index: number) => {
    if (!selectedFiles) return

    const dt = new DataTransfer()
    Array.from(selectedFiles)
      .filter((_, i) => i !== index)
      .forEach((file) => dt.items.add(file))

    setSelectedFiles(dt.files.length > 0 ? dt.files : null)
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select at least one CSV file.")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    Array.from(selectedFiles).forEach((file) => {
      formData.append("files", file)
    })

    try {
      const response = await axios.post("/api/insert-via-csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Response from the Backend API route: ", response.data)
      toast.success("Data inserted successfully and temporary CSV files have been cleaned up.")
      setSelectedFiles(null)
    } catch (error) {
      console.error("Error uploading files:", error)
      toast.error("Failed to upload files. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  return (
    <div className="min-h-[92vh] w-full flex items-center justify-center p-6 bg-gradient-to-br from-black via-black to-green-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,127,0.1),transparent_50%)] pointer-events-none" />

      <Card className="w-full max-w-2xl bg-black/60 border border-green-900/30 backdrop-blur-sm shadow-xl">
        <CardHeader className="border-b border-green-900/20 pb-6">
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="h-6 w-6 text-green-500" />
            CSV Data Uploader
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload your CSV files to import data into the system
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-all duration-300 text-center ${
              isDragging
                ? "border-green-500 bg-green-500/10"
                : "border-gray-700 hover:border-green-600/50 hover:bg-green-900/5"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" accept=".csv" multiple onChange={handleFileChange} className="hidden" id="fileInput" />

            <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-full bg-green-900/20 flex items-center justify-center mb-2">
                <FileUp className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-medium text-white">Drag & drop your CSV files here</p>
              <p className="text-sm text-gray-400">
                or <span className="text-green-500 underline">browse files</span> from your computer
              </p>
              <p className="text-xs text-gray-500 mt-2">Only CSV files are supported</p>
            </label>
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-white font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                Selected Files ({selectedFiles.length})
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {Array.from(selectedFiles).map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-md p-3"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <FileText className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-400 hover:text-white hover:bg-gray-700"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
              className="bg-green-600 cursor-pointer hover:bg-green-700 text-white font-medium px-6"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

