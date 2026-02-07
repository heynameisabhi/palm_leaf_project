"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
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
import { AlertCircle, ArrowLeft, Edit, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatTimeAgo } from "@/helpers/formatTime";
import { Prisma } from "@prisma/client";

type GranthaDeckWithGranthas = Prisma.GranthaDeckGetPayload<{
  include: {
    user: { select: { user_name: true } };
    granthas: { include: { language: true; author: true } };
    _count: { select: { granthas: true } };
  };
}>;

export default function GranthaDeckDetailView() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["grantha-deck-detail", deckId],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/grantha-deck/${deckId}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-64 bg-zinc-800" />
          <Skeleton className="h-4 w-48 bg-zinc-800" />
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 bg-zinc-800" />
              <Skeleton className="h-4 w-1/2 mt-2 bg-zinc-800" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full bg-zinc-800" />
                ))}
              </div>
            </CardContent>
          </Card>
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
            {error instanceof Error ? error.message : "Failed to load Grantha Deck details"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const deck: GranthaDeckWithGranthas = data.granthaDeck;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-black bg-white cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">
                {deck.grantha_deck_name || `Deck ${deck.grantha_deck_id.substring(0, 8)}`}
              </h1>
              <p className="text-muted-foreground mt-1">
                Created by {" "}
                <span className="text-zinc-500">{deck.user.user_name}</span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/admin/dashboard/data/edit/deck/${deck.grantha_deck_id}`)}
            className="bg-white hover:bg-gray-200 text-black cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
            Edit Deck
          </Button>
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-gray-200">Deck Information</CardTitle>
            <CardDescription className="text-zinc-400">
              Detailed information about this Grantha Deck
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Owner Name</h3>
                  <p className="text-zinc-100 mt-1">{deck.grantha_owner_name || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Source Address</h3>
                  <p className="text-zinc-100 mt-1">{deck.grantha_source_address || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Physical Condition</h3>
                  <p className="text-zinc-100 mt-1">{deck.physical_condition || "Not specified"}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Dimensions</h3>
                  <p className="text-zinc-100 mt-1">
                    {deck.length_in_cms ? `${deck.length_in_cms} × ${deck.width_in_cms} cm` : "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Total Leaves</h3>
                  <p className="text-zinc-100 mt-1">{deck.total_leaves || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Total Images</h3>
                  <p className="text-zinc-100 mt-1">{deck.total_images || "Not specified"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Stitch or Non Stitch</h3>
                  <p className="text-zinc-100 mt-1">{deck.stitch_or_nonstitch || "Not specified"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold text-gray-300 mb-4">Granthas: {deck._count.granthas}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deck.granthas.map((grantha) => (
              <Card
                key={grantha.grantha_id}
                className="overflow-hidden hover:shadow-md transition-shadow bg-zinc-900 border-zinc-800"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-zinc-200">
                        {grantha.grantha_name || `Grantha ${grantha.grantha_id.substring(0, 8)}`}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 mt-1">
                        By {grantha.author.author_name || "Unknown Author"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/dashboard/data/view/grantha/${grantha.grantha_id}`)}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/admin/dashboard/data/edit/grantha/${grantha.grantha_id}`)}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-950 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                        {grantha.language.language_name || "Unknown Language"}
                      </Badge>
                    </div>
                    {grantha.description && (
                      <p className="text-zinc-400 text-sm">{grantha.description}</p>
                    )}
                    {grantha.remarks && (
                      <div className="text-zinc-500 text-sm">
                        <strong>Remarks:</strong> {grantha.remarks}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 