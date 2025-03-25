"use client";

import type React from "react";

import { useState } from "react";
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

const FolderPathInput: React.FC = () => {
  const [folderPath, setFolderPath] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folderDetails, setFolderDetails] = useState<FolderDetails | null>(
    null
  );

  // const [mainFolderName, setMainFolderName] = useState<string>("")

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

      // setMainFolderName(response.data.path.split('//').pop())

      // console.log(mainFolderName)
      
    } catch (err) {
      console.error("Error:", err);
      setError(
        "Error fetching folder details. Make sure the path is valid and the server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-900/90 shadow-xl backdrop-blur-md">
        <CardHeader className="border-b border-slate-800 bg-slate-900">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-indigo-400" />
            Folder Explorer
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter a folder path to view its contents
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                type="text"
                placeholder="Paste the absolute folder path here..."
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="pl-10 bg-slate-950 border-slate-700 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
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
          <CardFooter className="flex flex-col border-t border-slate-800 pt-6 pb-6">
            <div className="w-full space-y-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <div className="bg-indigo-500/10 p-2 rounded-md mr-3">
                    <Folder className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-100">
                      {folderDetails.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-[250px]">
                      {folderDetails.path}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-md">
                  <div className="flex items-center">
                    <HardDrive className="h-4 w-4 mr-2 text-indigo-400" />
                    <span className="text-slate-300 text-sm font-medium">
                      Storage
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-indigo-500/20 text-indigo-300 border-none"
                  >
                    {folderDetails.size}
                  </Badge>
                </div>

                <div className="flex justify-between text-xs text-slate-400 px-1">
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
                  className="h-1.5 bg-slate-700"
                />
              </div>

              <Tabs defaultValue="files" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
                  <TabsTrigger
                    value="files"
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                  >
                    Files ({folderDetails.files.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="folders"
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                  >
                    Folders ({folderDetails.subfolders.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="files" className="mt-4">
                  <ScrollArea className="h-48 rounded-md border border-slate-700 bg-slate-800/20 p-2">
                    {folderDetails.files.map((file, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <li className="text-sm text-slate-300 flex items-center gap-2 p-1.5 rounded hover:bg-slate-700/30 transition-colors">
                              <div className="bg-slate-700/50 p-1 rounded">
                                <File className="h-3.5 w-3.5 text-indigo-400" />
                              </div>
                              <span className="truncate">{file.name}</span>{" "}
                              {/* Use file.name instead of file */}
                            </li>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{file.name}</p>{" "}
                            {/* Use file.name instead of file */}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="folders" className="mt-4">
                  <ScrollArea className="h-48 rounded-md border border-slate-700 bg-slate-800/20 p-2">
                    {folderDetails.subfolders.map((folder, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <li className="text-sm text-slate-300 flex items-center gap-2 p-1.5 rounded hover:bg-slate-700/30 transition-colors">
                              <div className="bg-slate-700/50 p-1 rounded">
                                <Folder className="h-3.5 w-3.5 text-indigo-400" />
                              </div>
                              <span className="truncate">{folder.path.split("\\").pop()}</span>{" "}
                              {/* Use folder.name */}
                            </li>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{folder.path.split("\\").pop()}</p> {/* Use folder.name */}
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
    </div>
  );
};

export default FolderPathInput;
