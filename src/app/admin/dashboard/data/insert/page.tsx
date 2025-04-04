"use client";

import type React from "react";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Loader2,
  Folder,
  File,
  HardDrive,
  AlertCircle,
  Search,
  FolderOpen,
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
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Progress } from "@/components/ui/Progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";
import { toast } from "sonner";

interface FolderDetails {
  name: string;
  path: string;
  files: File[];
  subfolders: Subfolder[];
  totalImages: number;
  size: number;
}

interface File {
  name: string;
  path: string;
  size: number;
  extension: string;
  resolution: number[];
  dpi: number[];
}

interface Subfolder {
  name: string;
  path: string;
  files: File[];
  // subfolders: string[];
  totalImages: number;
  size: number;
}

const page: React.FC = () => {
  const [folderPath, setFolderPath] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folderDetails, setFolderDetails] = useState<FolderDetails | null>(
    null
  );

  const [showCreateCsvButton, setShowCreateCsvButton] =
    useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFolderDetails(null);

    if (!folderPath.trim()) {
      setError("Please enter a valid folder path.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/get-folder-details",
        {
          folder_path: folderPath,
        }
      );

      console.log(response.data);

      setFolderDetails(response.data);
    } catch (err) {
      console.error("Error:", err);
      setError(
        "Error fetching folder details. Make sure the path is valid and the server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (folderDetails) {
      setShowCreateCsvButton(true);
    }
  }, [folderDetails]);

  const extractGranthaDetails = (folderDetails: FolderDetails | null) => {
    if (folderDetails) {
      const granthaDeckId = folderDetails.path.split("\\").pop() || "";
      const totalImages = folderDetails.totalImages;
      const totalLeaves = Math.ceil(totalImages / 2);

      const mainGranthaImagesAndDetails = folderDetails.files;
      const subGranthas = folderDetails.subfolders.map((sub: any) => ({
        subgrantha_name: sub.path.split("\\").pop() || "",
        images: sub.files,
      }));

      console.log("Grantha Deck ID:", granthaDeckId);
      console.log("Total Images:", totalImages);
      console.log("Total Leaves:", totalLeaves);
      console.log("Main Grantha Image and their details:", mainGranthaImagesAndDetails);
      console.log("SubGranthas:", subGranthas);

      saveDetailsToCSV({
        granthaDeckId,
        totalImages,
        totalLeaves,
        mainGranthaImagesAndDetails,
        subGranthas,
      });
    }
  };

  const saveDetailsToCSV = async (data: any) => {
    try {
      const response = await axios.post("/api/save-to-csv", data);
      console.log("CSV Files Created:", response.data.files);

      toast.success("CSV files created successfully.");
      // setCsvFiles(response.data.files);
    } catch (error) {
      console.error("Error saving CSV files:", error);
      setError("Error creating CSV files. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gradient-to-tl from-zinc-950 via-black/30 to-emerald-950/80 p-3">
      <Card className="w-full max-w-md border-[#1a1a1a] bg-black shadow-xl backdrop-blur-md">
        <CardHeader className="border-b border-[#1a1a1a] bg-black">
          <CardTitle className="text-white flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-green-400" />
            Folder Explorer
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter a folder path to view its contents
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <Input
                type="text"
                placeholder="Paste the absolute folder path here..."
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="pl-10 bg-[#121212] border-[#1a1a1a] text-white focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-950 to-green-600 hover:bg-green-500 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Get Folder Details"
              )}
            </Button>
          </form>

          {error && (
            <Alert
              variant="destructive"
              className="mt-4 bg-red-950/30 border-red-500/50 text-red-300"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        {folderDetails && (
          <CardFooter className="flex flex-col border-t border-[#1a1a1a] pt-6 pb-6">
            <div className="w-full space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <div className="bg-green-500/10 p-2 rounded-md mr-3">
                    <Folder className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {folderDetails.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate max-w-[250px]">
                      {folderDetails.path}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-md">
                  <div className="flex items-center">
                    <HardDrive className="h-4 w-4 mr-2 text-green-400" />
                    <span className="text-gray-300 text-sm font-medium">
                      Storage
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-500/20 text-green-300 border-none"
                  >
                    {folderDetails.size}
                  </Badge>
                </div>

                <div className="flex justify-between text-xs text-gray-400 px-1">
                  <span>Files: {folderDetails.files.length}</span>
                  <span>Folders: {folderDetails.subfolders.length}</span>
                  <span>Total: {folderDetails.totalImages}</span>
                </div>

                <Progress
                  value={
                    (folderDetails.files.length /
                      (folderDetails.files.length +
                        folderDetails.subfolders.length)) *
                    100
                  }
                  className="h-1.5 bg-gray-700"
                />
              </div>

              <Tabs defaultValue="files" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a]">
                  <TabsTrigger
                    value="files"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    Files ({folderDetails.files.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="folders"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    Folders ({folderDetails.subfolders.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="files" className="mt-4">
                  <ScrollArea className="h-48 rounded-md border border-[#1a1a1a] bg-[#121212] p-2">
                    {folderDetails.files.map((file, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <li className="text-sm text-gray-300 flex items-center gap-2 p-1.5 rounded hover:bg-gray-700/30 transition-colors">
                              <div className="bg-gray-700/50 p-1 rounded">
                                <File className="h-3.5 w-3.5 text-green-400" />
                              </div>
                              <span className="truncate">{file.name}</span>
                            </li>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{file.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="folders" className="mt-4">
                  <ScrollArea className="h-48 rounded-md border border-[#1a1a1a] bg-[#121212] p-2">
                    {folderDetails.subfolders.map((folder, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <li className="text-sm text-gray-300 flex items-center gap-2 p-1.5 rounded hover:bg-gray-700/30 transition-colors">
                              <div className="bg-gray-700/50 p-1 rounded">
                                <Folder className="h-3.5 w-3.5 text-green-400" />
                              </div>
                              <span className="truncate">
                                {folder.path.split("\\").pop()}
                              </span>
                            </li>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{folder.path.split("\\").pop()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </CardFooter>
        )}
      </Card>

      {showCreateCsvButton && (
        <Button
          onClick={() => extractGranthaDetails(folderDetails)}
          className="mt-10 cursor-pointer bg-gradient-to-r from-green-950 to-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-all"
        >
          Create CSV
        </Button>
      )}
    </div>
  );
};

export default page;
