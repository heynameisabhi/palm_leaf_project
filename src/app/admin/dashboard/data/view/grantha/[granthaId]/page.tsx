"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertCircle, ArrowLeft, Edit } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Prisma } from "@prisma/client";

type GranthaWithDetails = Prisma.GranthaGetPayload<{
  include: {
    granthaDeck: {
      select: {
        grantha_deck_id: true;
        grantha_deck_name: true;
        user: {
          select: { user_name: true };
        };
      };
    };
    language: true;
    author: true;
    scannedImages: {
      include: {
        scanningProperties: true;
      };
    };
  };
}>;

export default function GranthaDetailView() {
  const params = useParams();
  const router = useRouter();
  const granthaId = params.granthaId as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["grantha-detail", granthaId],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/grantha/${granthaId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-64 bg-zinc-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-zinc-800" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-6 w-full bg-zinc-800" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="bg-zinc-900 border-red-900 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load Grantha details"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const grantha: GranthaWithDetails = data.grantha;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-black bg-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-100">
              {grantha.grantha_name || "Untitled Grantha"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Part of{" "}
              <Button
                variant="link"
                onClick={() => router.push(`/admin/dashboard/data/view/${grantha.granthaDeck.grantha_deck_id}`)}
                className="text-zinc-400 hover:text-zinc-300 p-0"
              >
                {grantha.granthaDeck.grantha_deck_name || "Untitled Deck"}
              </Button>
            </p>
          </div>
          {data.canEdit && (
            <Button
              onClick={() => router.push(`/admin/dashboard/data/edit/grantha/${grantha.grantha_id}`)}
              className="bg-white hover:bg-gray-200 text-black cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Grantha
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-gray-200">Basic Information</CardTitle>
              <CardDescription className="text-zinc-400">
                Core details about this Grantha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Author</h3>
                  <p className="text-zinc-100 mt-1">
                    {grantha.author.author_name || "Not specified"}
                  </p>
                  {grantha.author.birth_year && grantha.author.death_year && (
                    <p className="text-zinc-500 text-sm">
                      ({grantha.author.birth_year} - {grantha.author.death_year})
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Language</h3>
                  <p className="text-zinc-100 mt-1">
                    {grantha.language.language_name || "Not specified"}
                  </p>
                </div>
              </div>

              {grantha.description && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Description</h3>
                  <p className="text-zinc-100 mt-1 whitespace-pre-wrap">
                    {grantha.description}
                  </p>
                </div>
              )}

              {grantha.remarks && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Remarks</h3>
                  <p className="text-zinc-100 mt-1">{grantha.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-gray-200">Author Details</CardTitle>
              <CardDescription className="text-zinc-400">
                Information about the author
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {grantha.author.bio && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Biography</h3>
                  <p className="text-zinc-100 mt-1 whitespace-pre-wrap">
                    {grantha.author.bio}
                  </p>
                </div>
              )}
              {grantha.author.scribe_name && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Scribe</h3>
                  <p className="text-zinc-100 mt-1">{grantha.author.scribe_name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {grantha.scannedImages.length > 0 && (
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-gray-200">
                Scanned Images ({grantha.scannedImages.length})
              </CardTitle>
              <CardDescription className="text-zinc-400">
                All scanned images associated with this Grantha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grantha.scannedImages.map((image) => (
                  <Card
                    key={image.image_id}
                    className="bg-zinc-900 border-zinc-800"
                  >
                    <CardContent className="p-4">
                      <h4 className="font-medium text-zinc-200 mb-2">
                        {image.image_name || "Untitled Image"}
                      </h4>
                      <div className="mb-4">
                        <p className="text-zinc-400 text-sm">Image Path:</p>
                        <p className="text-zinc-300 text-sm break-all">
                          {image.image_url}
                        </p>
                      </div>
                      {image.scanningProperties && (
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-zinc-400">Resolution</p>
                              <p className="text-zinc-300">
                                {image.scanningProperties.resolution_dpi}
                              </p>
                            </div>
                            <div>
                              <p className="text-zinc-400">Format</p>
                              <p className="text-zinc-300">
                                {image.scanningProperties.file_format}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-zinc-400">Scanner Model</p>
                            <p className="text-zinc-300">
                              {image.scanningProperties.scanner_model}
                            </p>
                          </div>
                          {image.scanningProperties.worked_by && (
                            <div>
                              <p className="text-zinc-400">Worked By</p>
                              <p className="text-zinc-300">
                                {image.scanningProperties.worked_by}
                              </p>
                            </div>
                          )}
                          {image.scanningProperties.scanning_start_date && (
                            <div>
                              <p className="text-zinc-400">Scanned On</p>
                              <p className="text-zinc-300">
                                {image.scanningProperties.scanning_start_date}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
      </div>
    </div>
  );
} 