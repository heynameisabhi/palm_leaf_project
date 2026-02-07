"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertCircle, Filter, RefreshCw, Search, User, Database, Edit, Eye, Trash2, BookOpen, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatTimeAgo } from "@/helpers/formatTime";
import { GranthaDeck, Prisma, Author } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "sonner";

type GranthaDeckWithCount = Prisma.GranthaDeckGetPayload<{
  include: {
    _count: { select: { granthas: true } },
    user: { select: { name: true, email: true } }
  }
}>;

export default function GranthaDeckViewer() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"decks" | "authors">("decks");
  const [deckName, setDeckName] = useState("");
  const [deckId, setDeckId] = useState("");
  const [limit, setLimit] = useState("10");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<GranthaDeckWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const router = useRouter();

  const fetchGranthaDecks = async () => {
    const queryParams = new URLSearchParams({
      deckName: deckName || "",
      deckId: deckId || "",
      limit: limit ? limit.toString() : "10",
      startDate: startDate || "",
      endDate: endDate || "",
    }).toString();

    const response = await axios.get(`/api/user/view-records?${queryParams}`);
    return response.data;
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["grantha-decks", deckName, deckId, limit, startDate, endDate],
    queryFn: fetchGranthaDecks,
    enabled: !!session,
  });

  // Fetch authors
  const fetchAuthors = async () => {
    const response = await axios.get('/api/authors');
    return response.data;
  };

  const { data: authorsData, isLoading: authorsLoading, isError: authorsError, error: authorsErrorMsg, refetch: refetchAuthors } = useQuery({
    queryKey: ["authors"],
    queryFn: fetchAuthors,
    enabled: !!session && activeTab === "authors",
  });

  const handleDeleteClick = (deck: GranthaDeckWithCount) => {
    setDeckToDelete(deck);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deckToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(`/api/user/delete-records/${deckToDelete.grantha_deck_id}`);

      // Refresh the data after successful deletion
      await refetch();

      // Close modal and reset state
      setIsDeleteModalOpen(false);
      setDeckToDelete(null);

      toast.success(`Deck ${deckToDelete.grantha_deck_id} deleted successfully.`);

    } catch (error) {
      console.error("Error deleting deck:", error);
      // Handle error - you might want to show a toast notification here
      toast.error(`Failed to delete deck ${deckToDelete?.grantha_deck_name}. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeckToDelete(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-200">
              View Data
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your Grantha Deck records and Authors
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => activeTab === "decks" ? setIsFilterOpen(!isFilterOpen) : null}
              disabled={activeTab === "authors"}
              className="flex items-center gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 cursor-pointer hover:text-zinc-300 text-zinc-300 disabled:opacity-50"
            >
              <Filter className="h-4 w-4" />
              {isFilterOpen ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              onClick={() => activeTab === "decks" ? refetch() : refetchAuthors()}
              variant="secondary"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("decks")}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === "decks"
              ? "text-green-500 border-b-2 border-green-500"
              : "text-zinc-400 hover:text-zinc-300"
              }`}
          >
            <BookOpen className="h-4 w-4" />
            Grantha Decks
          </button>
          <button
            onClick={() => setActiveTab("authors")}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${activeTab === "authors"
              ? "text-green-500 border-b-2 border-green-500"
              : "text-zinc-400 hover:text-zinc-300"
              }`}
          >
            <Users className="h-4 w-4" />
            Authors
          </button>
        </div>

        {/* Grantha Decks Tab Content */}
        {activeTab === "decks" && (
          <>
            {isFilterOpen && (
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-gray-200">Filter Options</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Customize your view by filtering the records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="deckName"
                        className="text-sm font-medium text-zinc-300"
                      >
                        Grantha Deck Name
                      </label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          id="deckName"
                          placeholder="Filter by Grantha deck name"
                          value={deckName}
                          onChange={(e) => setDeckName(e.target.value)}
                          className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="deckId"
                        className="text-sm font-medium text-zinc-300"
                      >
                        Grantha Deck ID
                      </label>
                      <div className="relative">
                        <Database className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          id="deckId"
                          placeholder="Filter by Grantha deck ID"
                          value={deckId}
                          onChange={(e) => setDeckId(e.target.value)}
                          className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="limit"
                        className="text-sm font-medium text-zinc-300"
                      >
                        Limit
                      </label>
                      <Input
                        id="limit"
                        type="number"
                        placeholder="Number of records"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        min="1"
                        className="bg-zinc-900 border-zinc-700 text-zinc-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="startDate"
                        className="text-sm font-medium text-zinc-300"
                      >
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          id="startDate"
                          type="date"
                          placeholder="Start date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="endDate"
                        className="text-sm font-medium text-zinc-300"
                      >
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          id="endDate"
                          type="date"
                          placeholder="End date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-300"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeckName("");
                      setDeckId("");
                      setLimit("10");
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-zinc-300 cursor-pointer hover:bg-zinc-800"
                  >
                    Reset Filters
                  </Button>
                  <Button
                    onClick={() => refetch()}
                    className="bg-white hover:bg-zinc-200 text-black"
                  >
                    Apply Filters
                  </Button>
                </CardFooter>
              </Card>
            )}

            {isLoading ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: Number.parseInt(limit) || 3 }).map((_, i) => (
                    <Card
                      key={i}
                      className="overflow-hidden bg-zinc-900 border-zinc-800"
                    >
                      <CardHeader className="pb-2">
                        <Skeleton className="h-6 w-3/4 bg-zinc-800" />
                        <Skeleton className="h-4 w-1/2 mt-2 bg-zinc-800" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full bg-zinc-800" />
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Skeleton className="h-4 w-1/3 bg-zinc-800" />
                        <Skeleton className="h-4 w-1/4 bg-zinc-800" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border border-zinc-800">
                    <div className="grid grid-cols-6 gap-4 p-4 border-b border-zinc-800">
                      <div className="font-medium text-zinc-300">Deck Name</div>
                      <div className="font-medium text-zinc-300">User</div>
                      <div className="font-medium text-zinc-300">Granthas</div>
                      <div className="font-medium text-zinc-300">Created</div>
                      <div className="font-medium text-zinc-300">ID</div>
                      <div className="font-medium text-zinc-300">Actions</div>
                    </div>
                    {Array.from({ length: Number.parseInt(limit) || 5 }).map((_, i) => (
                      <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b border-zinc-800">
                        <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                        <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                        <Skeleton className="h-4 w-1/4 bg-zinc-800" />
                        <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                        <Skeleton className="h-4 w-1/3 bg-zinc-800" />
                        <Skeleton className="h-4 w-1/4 bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : isError ? (
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
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {data?.granthaDeckRecords?.length || 0} records
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                      className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-300 cursor-pointer"
                    >
                      {viewMode === "grid" ? "Table View" : "Grid View"}
                    </Button>
                    {startDate && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 bg-zinc-900 border-zinc-700 text-zinc-300"
                      >
                        From: {new Date(startDate).toLocaleDateString()}
                      </Badge>
                    )}
                    {endDate && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 bg-zinc-900 border-zinc-700 text-zinc-300"
                      >
                        To: {new Date(endDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>

                {data?.granthaDeckRecords?.length > 0 ? (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.granthaDeckRecords.map((deck: GranthaDeckWithCount) => (
                        <Card
                          key={deck.grantha_deck_id}
                          className="overflow-hidden hover:shadow-md transition-all bg-zinc-900 border-zinc-800 group"
                        >
                          <CardHeader>
                            <CardTitle className="text-zinc-200 group-hover:text-white transition-colors">
                              {deck.grantha_deck_name ||
                                `Deck ${deck.grantha_deck_id.substring(0, 8)}`}
                            </CardTitle>
                            <CardDescription className="flex justify-between items-center text-zinc-400">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {deck.user?.name || deck.user_id.substring(0, 8)}
                              </span>
                              <span className="text-xs">
                                {formatTimeAgo(new Date(deck.createdAt))}
                              </span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-400">
                                Granthas: {deck._count.granthas}
                              </span>
                              <Badge
                                variant="secondary"
                                className="bg-zinc-800 text-zinc-300"
                              >
                                ID: {deck.grantha_deck_id.substring(0, 6)}
                              </Badge>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-2">
                            {deck.user_id === session?.user?.id && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/data/view/edit-grantha-deck/${deck.grantha_deck_id}`)}
                                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                                >
                                  <Edit className="h-4 w-4 text-white" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(deck)}
                                  className="bg-zinc-800 border-zinc-700 hover:bg-red-800 hover:border-red-700 text-zinc-300 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/data/view/view-grantha-deck/${deck.grantha_deck_id}`)}
                              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                            >
                              <Eye className="h-4 w-4 text-white" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border border-zinc-800">
                        <div className="grid grid-cols-6 gap-4 p-4 border-b border-zinc-800">
                          <div className="font-medium text-zinc-300">Deck Name</div>
                          <div className="font-medium text-zinc-300">User</div>
                          <div className="font-medium text-zinc-300">Granthas</div>
                          <div className="font-medium text-zinc-300">Created</div>
                          <div className="font-medium text-zinc-300">ID</div>
                          <div className="font-medium text-zinc-300">Actions</div>
                        </div>
                        {data.granthaDeckRecords.map((deck: GranthaDeckWithCount) => (
                          <div key={deck.grantha_deck_id} className="grid grid-cols-6 gap-4 p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                            <div className="text-zinc-300">{deck.grantha_deck_name || `Deck ${deck.grantha_deck_id.substring(0, 8)}`}</div>
                            <div className="text-zinc-400 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {deck.user?.name || deck.user_id.substring(0, 8)}
                            </div>
                            <div className="text-zinc-400">{deck._count.granthas}</div>
                            <div className="text-zinc-400">{formatTimeAgo(new Date(deck.createdAt))}</div>
                            <div className="text-zinc-400">{deck.grantha_deck_id}</div>
                            <div className="flex gap-2">
                              {deck.user_id === session?.user?.id && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/data/view/edit-grantha-deck/${deck.grantha_deck_id}`)}
                                    className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                                  >
                                    <Edit className="h-4 w-4 text-white" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteClick(deck)}
                                    className="bg-zinc-800 border-zinc-700 hover:bg-red-800 hover:border-red-700 text-zinc-300 hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/dashboard/data/view/view-grantha-deck/${deck.grantha_deck_id}`)}
                                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                              >
                                <Eye className="h-4 w-4 text-white" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-zinc-300">
                      No records found
                    </h3>
                    <p className="text-zinc-400 mt-1">
                      Try changing your filters or adding new records
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
              isOpen={isDeleteModalOpen}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
              title="Delete Grantha Deck"
              message={
                deckToDelete
                  ? `Are you sure you want to delete "${deckToDelete.grantha_deck_name || `Deck ${deckToDelete.grantha_deck_id.substring(0, 8)}`}"? This will permanently delete the deck and all ${deckToDelete._count.granthas} associated granthas. This action cannot be undone.`
                  : "Are you sure you want to delete this deck?"
              }
              confirmButtonText="Delete Deck"
              cancelButtonText="Cancel"
              isLoading={isDeleting}
              variant="danger"
            />
          </>
        )}

        {/* Authors Tab Content */}
        {activeTab === "authors" && (
          <>
            {authorsLoading ? (
              <div className="space-y-4">
                <div className="rounded-md border border-zinc-800">
                  <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-800">
                    <div className="font-medium text-zinc-300">Author Name</div>
                    <div className="font-medium text-zinc-300">Birth Year</div>
                    <div className="font-medium text-zinc-300">Death Year</div>
                    <div className="font-medium text-zinc-300">Bio</div>
                    <div className="font-medium text-zinc-300">ID</div>
                  </div>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-800">
                      <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                      <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                      <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                      <Skeleton className="h-4 w-full bg-zinc-800" />
                      <Skeleton className="h-4 w-1/3 bg-zinc-800" />
                    </div>
                  ))}
                </div>
              </div>
            ) : authorsError ? (
              <Alert
                variant="destructive"
                className="bg-zinc-900 border-red-900 text-red-400"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {authorsErrorMsg instanceof Error ? authorsErrorMsg.message : "Failed to load authors"}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {authorsData?.authors?.length || 0} authors
                  </p>
                </div>

                {authorsData?.authors?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-md border border-zinc-800">
                      <div className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-800 bg-zinc-950">
                        <div className="font-medium text-zinc-300">Author Name</div>
                        <div className="font-medium text-zinc-300">Birth Year</div>
                        <div className="font-medium text-zinc-300">Death Year</div>
                        <div className="font-medium text-zinc-300">Bio</div>
                        <div className="font-medium text-zinc-300">ID</div>
                      </div>
                      {authorsData.authors.map((author: Author) => (
                        <div key={author.author_id} className="grid grid-cols-5 gap-4 p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                          <div className="text-zinc-300 font-medium">{author.author_name || "Unknown"}</div>
                          <div className="text-zinc-400">{author.birth_year || "Unknown"}</div>
                          <div className="text-zinc-400">{author.death_year || "Unknown"}</div>
                          <div className="text-zinc-400 text-sm truncate" title={author.bio || "No bio available"}>{author.bio || "No bio available"}</div>
                          <div className="text-zinc-400 text-sm font-mono">{author.author_id.substring(0, 8)}...</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-zinc-300">
                      No authors found
                    </h3>
                    <p className="text-zinc-400 mt-1">
                      No authors have been added to the system yet
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}