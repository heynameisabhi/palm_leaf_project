"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { use } from "react";
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
  LayoutGrid,
  List,
  FileText,
  User,
  Ruler,
  Image,
  BookOpen,
  CalendarDays,
  BookMarked,
  Languages,
  Trash2,
} from "lucide-react";
import { formatTimeAgo } from "@/helpers/formatTime";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "sonner";

type Grantha = {
  grantha_id: string;
  grantha_name: string;
  description: string;
  remarks: string;
  createdAt: string;
  updatedAt: string;
  language_id: string;
  author_id: string;
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
  scannedImages?: {
    image_id: string;
    image_name: string;
    image_url: string;
  }[];
};

type GranthaDeck = {
  grantha_deck_id: string;
  grantha_deck_name: string;
  grantha_owner_name: string;
  grantha_source_address: string;
  length_in_cms: number | null;
  width_in_cms: number | null;
  total_leaves: number | null;
  total_images: number | null;
  stitch_or_nonstitch: string | null;
  physical_condition: string | null;
  createdAt: string;
  updatedAt: string;
  user_id: string;
  user?: {
    user_id: string;
    user_name: string;
    email: string;
  };
  granthas?: Grantha[];
  _count?: {
    granthas: number;
  };
};

export default function GranthaDeckViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const deckId = resolvedParams.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Delete deck modal states
  const [isDeckDeleteModalOpen, setIsDeckDeleteModalOpen] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);

  // Delete grantha modal states
  const [isGranthaDeleteModalOpen, setIsGranthaDeleteModalOpen] = useState(false);
  const [granthaToDelete, setGranthaToDelete] = useState<Grantha | null>(null);
  const [isDeletingGrantha, setIsDeletingGrantha] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["grantha-deck-view", deckId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/user/view-records/${deckId}`);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          throw new Error("Grantha deck not found");
        }
        throw error;
      }
    },
    enabled: !!deckId,
  });

  const handleDeckDeleteClick = () => {
    setIsDeckDeleteModalOpen(true);
  };

  const handleDeckDeleteConfirm = async () => {
    setIsDeletingDeck(true);
    try {
      await axios.delete(`/api/user/delete-records/${deckId}`);

      setIsDeckDeleteModalOpen(false);
      toast.success(`Deck deleted successfully.`);

      // Navigate back to the deck list or dashboard
      router.push('/dashboard/data/view');

    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error(`Failed to delete deck. Please try again.`);
    } finally {
      setIsDeletingDeck(false);
    }
  };

  const handleDeckDeleteCancel = () => {
    setIsDeckDeleteModalOpen(false);
  };

  const handleGranthaDeleteClick = (grantha: Grantha) => {
    setGranthaToDelete(grantha);
    setIsGranthaDeleteModalOpen(true);
  };

  const handleGranthaDeleteConfirm = async () => {
    if (!granthaToDelete) return;

    setIsDeletingGrantha(true);
    try {
      const response = await axios.delete(`/api/user/delete-grantha/${granthaToDelete.grantha_id}`);

      // Refresh the data after successful deletion
      await refetch();

      // Close modal and reset state
      setIsGranthaDeleteModalOpen(false);
      setGranthaToDelete(null);

      // Show success message with details from API response
      const deletedData = response.data.deletedGrantha;
      toast.success(
        `Grantha "${deletedData.name || granthaToDelete.grantha_name || granthaToDelete.grantha_id.substring(0, 8)}" deleted successfully. ${deletedData.deletedImagesCount > 0 ? `${deletedData.deletedImagesCount} associated images were also deleted.` : ''}`
      );

    } catch (error) {
      console.error("Error deleting grantha:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || "Failed to delete grantha. Please try again.";
        toast.error(errorMessage);
      } else {
        toast.error("Failed to delete grantha. Please try again.");
      }
    } finally {
      setIsDeletingGrantha(false);
    }
  };

  const handleGranthaDeleteCancel = () => {
    setIsGranthaDeleteModalOpen(false);
    setGranthaToDelete(null);
  };

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

          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="pb-2">
              <Skeleton className="h-7 w-48 bg-zinc-800" />
              <Skeleton className="h-4 w-64 mt-2 bg-zinc-800" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24 bg-zinc-800" />
                    <Skeleton className="h-4 w-32 bg-zinc-800" />
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Skeleton className="h-7 w-48 bg-zinc-800 mb-4" />
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-4 w-32 bg-zinc-800" />
                  <Skeleton className="h-8 w-32 bg-zinc-800" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
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

  const deck: GranthaDeck = data?.granthaDeck;
  const isOwner = session?.user?.id === deck.user_id;

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
              {deck.grantha_deck_name || `Deck ${deck.grantha_deck_id.substring(0, 8)}`}
            </h1>
            <p className="text-muted-foreground text-sm">
              Last updated {formatTimeAgo(new Date(deck.updatedAt))}
            </p>
          </div>
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-gray-200">Grantha Deck Details</CardTitle>
              {isOwner && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/data/view/edit-grantha-deck/${deck.grantha_deck_id}`)}
                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white text-zinc-300 h-8"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit Deck
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeckDeleteClick}
                    className="bg-zinc-800 border-zinc-700 hover:bg-red-800 hover:border-red-700 text-zinc-300 hover:text-red-300 h-8"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete Deck
                  </Button>
                </div>
              )}
            </div>
            <CardDescription className="text-sm text-zinc-400">
              Detailed information about this grantha deck
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">ID:</span>
                <span className="text-sm text-zinc-300">{deck.grantha_deck_id}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Owner:</span>
                <span className="text-sm text-zinc-300">{deck.grantha_owner_name || "Not specified"}</span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Source Address:</span>
                <span className="text-sm text-zinc-300">{deck.grantha_source_address || "Not specified"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Dimensions:</span>
                <span className="text-sm text-zinc-300">
                  {deck.length_in_cms ? `${deck.length_in_cms} cm × ` : ""}
                  {deck.width_in_cms ? `${deck.width_in_cms} cm` : "Not specified"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Total Leaves:</span>
                <span className="text-sm text-zinc-300">{deck.total_leaves || "Not specified"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Total Images:</span>
                <span className="text-sm text-zinc-300">{deck.total_images || "Not specified"}</span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Stitch Type:</span>
                <span className="text-sm text-zinc-300">
                  {deck.stitch_or_nonstitch ?
                    (deck.stitch_or_nonstitch === "stitch" ? "Stitch" : "Non Stitch") :
                    "Not specified"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Physical Condition:</span>
                <span className="text-sm text-zinc-300">{deck.physical_condition || "Not specified"}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Added By:</span>
                <span className="text-sm text-zinc-300">{deck.user?.user_name || deck.user_id}</span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-400">Created At:</span>
                <span className="text-sm text-zinc-300">{new Date(deck.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-zinc-200 mb-4">Associated Granthas</h3>

              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-zinc-400">
                  Total: {deck._count?.granthas || 0} granthas
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={`bg-zinc-900 hover:bg-zinc-700 hover:text-white cursor-pointer border-zinc-700 h-8 ${viewMode === "table"
                        ? "bg-white text-black"
                        : "text-zinc-400 hover:text-zinc-300"
                      }`}
                  >
                    <List className="h-3 w-3 mr-1" />
                    Table
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={`bg-zinc-900 hover:bg-zinc-700 hover:text-white cursor-pointer border-zinc-700 h-8 ${viewMode === "grid"
                        ? "bg-white text-black"
                        : "text-zinc-400 hover:text-zinc-300"
                      }`}
                  >
                    <LayoutGrid className="h-3 w-3 mr-1" />
                    Grid
                  </Button>
                </div>
              </div>

              {deck.granthas && deck.granthas.length > 0 ? (
                viewMode === "table" ? (
                  <div className="rounded-md border border-zinc-800 overflow-hidden">
                    <table className="min-w-full divide-y divide-zinc-800">
                      <thead className="bg-zinc-900">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Grantha Name
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Author
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Language
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            No. of Images
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-zinc-950 divide-y divide-zinc-800">
                        {deck.granthas.map((grantha) => (
                          <tr key={grantha.grantha_id} className="hover:bg-zinc-900/50">
                            <td className="px-4 py-3 text-sm text-zinc-300">
                              {grantha.grantha_name || `Grantha ${grantha.grantha_id.substring(0, 6)}`}
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-300">
                              {grantha.author?.author_name || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-300">
                              {grantha.language?.language_name || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm text-zinc-300">
                              {grantha.scannedImages?.length || "Unknown"}
                            </td>
                            <td className="px-4 py-3 text-sm flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/data/view/view-grantha/${grantha.grantha_id}`)}
                                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300 text-zinc-300 h-7"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {isOwner && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/data/view/edit-grantha/${grantha.grantha_id}`)}
                                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300 text-zinc-300 h-7"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGranthaDeleteClick(grantha)}
                                    className="bg-zinc-800 border-zinc-700 hover:bg-red-800 hover:border-red-700 text-zinc-300 hover:text-red-300 h-7"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deck.granthas.map((grantha) => (
                      <Card
                        key={grantha.grantha_id}
                        className="bg-zinc-900 border-zinc-800 hover:shadow-md transition-all"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-zinc-200">
                            {grantha.grantha_name || `Grantha ${grantha.grantha_id.substring(0, 6)}`}
                          </CardTitle>
                          <CardDescription className="text-xs text-zinc-400 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {grantha.author?.author_name || "Unknown Author"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-xs text-zinc-400 flex items-center gap-1">
                              <Languages className="h-3 w-3" />
                              <span className="text-zinc-300">{grantha.language?.language_name || "Unknown"}</span>
                            </div>
                            {grantha.scannedImages && (
                              <div className="text-xs text-zinc-400 flex items-center gap-1">
                                <Image className="h-3 w-3" />
                                <span className="text-zinc-300">{grantha.scannedImages.length} images</span>
                              </div>
                            )}
                            {grantha.description && (
                              <div className="text-xs text-zinc-400 flex items-center gap-1 col-span-2">
                                <BookMarked className="h-3 w-3" />
                                <span className="text-zinc-300">
                                  {grantha.description.length > 20
                                    ? `${grantha.description.substring(0, 20)}...`
                                    : grantha.description}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/data/view/view-grantha/${grantha.grantha_id}`)}
                            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300 text-zinc-300 h-7"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {isOwner && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/data/view/edit-grantha/${grantha.grantha_id}`)}
                                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300 text-zinc-300 h-7"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGranthaDeleteClick(grantha)}
                                className="bg-zinc-800 border-zinc-700 hover:bg-red-800 hover:border-red-700 text-zinc-300 hover:text-red-300 h-7"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-8 border border-zinc-800 rounded-md">
                  <h3 className="text-lg font-medium text-zinc-300">
                    No granthas found
                  </h3>
                  <p className="text-zinc-400 mt-1">
                    This grantha deck doesn't have any associated granthas yet.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Deck Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeckDeleteModalOpen}
        onClose={handleDeckDeleteCancel}
        onConfirm={handleDeckDeleteConfirm}
        title="Delete Grantha Deck"
        message={`Are you sure you want to delete "${deck?.grantha_deck_name || `Deck ${deck?.grantha_deck_id?.substring(0, 8)}`}"? This will permanently delete the deck and all ${deck?._count?.granthas || 0} associated granthas. This action cannot be undone.`}
        confirmButtonText="Delete Deck"
        cancelButtonText="Cancel"
        isLoading={isDeletingDeck}
        variant="danger"
      />

      {/* Delete Grantha Confirmation Modal */}
      <ConfirmationModal
        isOpen={isGranthaDeleteModalOpen}
        onClose={handleGranthaDeleteCancel}
        onConfirm={handleGranthaDeleteConfirm}
        title="Delete Grantha"
        message={
          granthaToDelete
            ? `Are you sure you want to delete "${granthaToDelete.grantha_name || `Grantha ${granthaToDelete.grantha_id.substring(0, 8)}`}"? This will permanently delete the grantha and all its associated data. This action cannot be undone.`
            : "Are you sure you want to delete this grantha?"
        }
        confirmButtonText="Delete Grantha"
        cancelButtonText="Cancel"
        isLoading={isDeletingGrantha}
        variant="danger"
      />
    </div>
  );
}