"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"; 
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton"; 
import { Badge } from "@/components/ui/Badge"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert"; 
import {
  AlertCircle,
  ArrowLeft,
  Edit,
  Eye,
  FileText,
  User,
  CalendarDays,
  Languages,
  BookMarked,
  Image as ImageIcon,
} from "lucide-react";
import { formatTimeAgo } from "@/helpers/formatTime";
import Image from "next/image";

type Grantha = {
  grantha_id: string;
  grantha_name: string;
  description: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  language_id: string;
  author_id: string;
  grantha_deck_id: string;
  language: {
    language_id: string;
    language_name: string;
  };
  author: {
    author_id: string;
    author_name: string;
    birth_year: string;
    death_year: string;
    bio: string;
    scribe_name: string;
  };
  granthaDeck: {
    grantha_deck_id: string;
    grantha_deck_name: string;
    user_id: string;
    user?: {
      user_id: string;
      user_name: string;
    };
  };
  scannedImages?: {
    image_id: string;
    image_name: string;
    image_url: string;
  }[];
};

interface PageParams {
  params: {
    id: string;
  };
}

export default function GranthaViewPage({ params }: PageParams) {
  const granthaId = params.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["grantha-view", granthaId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/user/view-grantha/${granthaId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          throw new Error("Grantha not found");
        }
        throw error;
      }
    },
    enabled: !!granthaId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 bg-zinc-800" />
            <div>
              <Skeleton className="h-8 w-64 bg-zinc-800" />
              <Skeleton className="h-4 w-32 mt-2 bg-zinc-800" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <Skeleton className="h-7 w-48 bg-zinc-800" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full bg-zinc-800" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <Skeleton className="h-7 w-48 bg-zinc-800" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24 bg-zinc-800" />
                        <Skeleton className="h-4 w-40 bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <Skeleton className="h-7 w-32 bg-zinc-800" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full bg-zinc-800" />
                  <div className="flex gap-2 mt-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-16 bg-zinc-800" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <Skeleton className="h-7 w-32 bg-zinc-800" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 bg-zinc-800" />
                        <Skeleton className="h-4 w-full bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <Alert
          variant="destructive"
          className="bg-zinc-900 border-red-900 text-red-400"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load data"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const grantha: Grantha = data?.grantha;
  const isOwner = session?.user?.id === grantha.granthaDeck.user_id;
  const hasImages = grantha.scannedImages && grantha.scannedImages.length > 0;
  
  if (hasImages && activeImageIndex >= grantha.scannedImages!.length) {
    setActiveImageIndex(0);
  }

  // Helper function to get image URL with proper format handling
  const getImageUrl = (imagePath: string) => {
    // Check if it's a TIFF file
    const isTiff = imagePath.toLowerCase().endsWith('.tif') || 
                   imagePath.toLowerCase().endsWith('.tiff');
    
    // If it's a TIFF, explicitly request JPEG conversion
    if (isTiff) {
      return `/api/images?path=${encodeURIComponent(imagePath)}&format=jpeg`;
    }
    
    // For other formats, let the API handle automatic format detection
    return `/api/images?path=${encodeURIComponent(imagePath)}`;
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-zinc-300 hover:bg-zinc-800 h-8"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-200">
              {grantha.grantha_name || `Grantha ${grantha.grantha_id.substring(0, 8)}`}
            </h1>
            <p className="text-muted-foreground text-sm">
              From deck <span className="underline cursor-pointer hover:text-white" onClick={() => router.push(`/dashboard/data/view/view-grantha-deck/${grantha.grantha_deck_id}`)}>
                {grantha.granthaDeck.grantha_deck_name || `Deck ${grantha.grantha_deck_id.substring(0, 8)}`}
              </span>
            </p>
          </div>

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/data/view/edit-grantha/${grantha.grantha_id}`)}
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white text-zinc-300 h-8 ml-auto"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit Grantha
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {grantha.description && (
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 whitespace-pre-wrap">{grantha.description}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">Grantha ID</h3>
                    <p className="text-zinc-300 mt-1">{grantha.grantha_id}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">Author</h3>
                    <p className="text-zinc-300 mt-1">{grantha.author.author_name || "Not specified"}</p>
                    {grantha.author.birth_year && grantha.author.death_year && (
                      <p className="text-xs text-zinc-500">
                        ({grantha.author.birth_year} - {grantha.author.death_year})
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">Language</h3>
                    <p className="text-zinc-300 mt-1">{grantha.language.language_name || "Not specified"}</p>
                  </div>

                  {grantha.author.scribe_name && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400">Scribe</h3>
                      <p className="text-zinc-300 mt-1">{grantha.author.scribe_name}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">Added By</h3>
                    <p className="text-zinc-300 mt-1">{grantha.granthaDeck.user?.user_name || "Unknown"}</p>
                  </div>
                </div>

                {grantha.remarks && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-zinc-400">Remarks</h3>
                    <p className="text-zinc-300 mt-1 whitespace-pre-wrap">{grantha.remarks}</p>
                  </div>
                )}

                {grantha.author.bio && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-zinc-400">Author Bio</h3>
                    <p className="text-zinc-300 mt-1 whitespace-pre-wrap">{grantha.author.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {hasImages && (
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-square overflow-hidden rounded-md mb-3">
                    <div 
                      className="w-full h-full bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url('${getImageUrl(grantha.scannedImages![activeImageIndex].image_url)}')`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover' 
                      }}
                    ></div>
                  </div>

                  {hasImages && grantha.scannedImages!.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {grantha.scannedImages!.map((image, index) => (
                        <div
                          key={image.image_id}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative w-16 h-16 rounded-md overflow-hidden cursor-pointer transition-all ${
                            activeImageIndex === index ? "ring-2 ring-white" : "opacity-70 hover:opacity-100"
                          }`}
                        >
                          <div 
                            className="w-full h-full bg-cover bg-center"
                            style={{ 
                              backgroundImage: `url('${getImageUrl(image.image_url)}')`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover' 
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">Quick Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">Author: {grantha.author.author_name || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">Language: {grantha.language.language_name || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">
                      Contains: {grantha.description ? "Description" : "No description"}
                      {grantha.remarks ? ", Notes" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">
                      Images: {hasImages ? grantha.scannedImages!.length : "None"}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">Updated: {formatTimeAgo(new Date(grantha.updatedAt))}</span>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}