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
import { AlertCircle, Filter, RefreshCw, Search, User, Database, Edit, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatTimeAgo } from "@/helpers/formatTime";
import { GranthaDeck, Prisma } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

type GranthaDeckWithCount = Prisma.GranthaDeckGetPayload<{
  include: {
    _count: { select: { granthas: true } },
    user: { select: { name: true, email: true } }
  }
}>;

export default function GranthaDeckViewer() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [username, setUsername] = useState(searchParams.get("username") || "");
  const [deckName, setDeckName] = useState(searchParams.get("deckName") || "");
  const [deckId, setDeckId] = useState(searchParams.get("deckId") || "");
  const [limit, setLimit] = useState(searchParams.get("limit") || "10");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(searchParams.get("showAllRecords") === "true");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Delete modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<GranthaDeckWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchGranthaDecks = async () => {
    const queryParams = new URLSearchParams({
      userId: showAllRecords ? (userId || "") : (session?.user?.id || ""),
      username: username || "",
      deckName: deckName || "",
      deckId: deckId || "",
      limit: limit || "10",
      startDate: startDate || "",
      endDate: endDate || "",
    }).toString();

    const response = await axios.get(`/api/user/view-records?${queryParams}`);
    return response.data;
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["grantha-decks", userId, username, deckName, deckId, limit, startDate, endDate, showAllRecords],
    queryFn: fetchGranthaDecks,
    enabled: !!session,
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
              My Grantha Deck Records
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your Grantha Deck records
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 cursor-pointer hover:text-zinc-300 text-zinc-300"
            >
              <Filter className="h-4 w-4" />
              {isFilterOpen ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              onClick={() => refetch()}
              variant="secondary"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {isFilterOpen && (
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-gray-200">Filter Options</CardTitle>
              <CardDescription className="text-zinc-400">
                Customize your view by filtering the records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showAllRecords"
                    checked={showAllRecords}
                    onChange={(e) => setShowAllRecords(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-green-500"
                  />
                  <label
                    htmlFor="showAllRecords"
                    className="text-sm font-medium text-zinc-300"
                  >
                    Show all records (not just mine)
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {showAllRecords && (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="userId"
                          className="text-sm font-medium text-zinc-300"
                        >
                          User ID
                        </label>
                        <div className="relative">
                          <Database className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                          <Input
                            id="userId"
                            placeholder="Filter by user ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="username"
                          className="text-sm font-medium text-zinc-300"
                        >
                          Username
                        </label>
                        <div className="relative">
                          <User className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                          <Input
                            id="username"
                            placeholder="Filter by username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-8 bg-zinc-900 border-zinc-700 text-zinc-300"
                          />
                        </div>
                      </div>
                    </>
                  )}
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
                      className="text-sm font-medium text-zinc-300"
                    >
                      Date Range
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-300"
                        placeholder="Start Date"
                      />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-300"
                        placeholder="End Date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="limit"
                      className="text-sm font-medium text-zinc-300"
                    >
                      Records per page
                    </label>
                    <Select
                      value={limit}
                      onValueChange={setLimit}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300">
                        <SelectValue placeholder="Select limit" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                        <SelectItem value="10">10 Records</SelectItem>
                        <SelectItem value="20">20 Records</SelectItem>
                        <SelectItem value="50">50 Records</SelectItem>
                        <SelectItem value="100">100 Records</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUserId("");
                  setUsername("");
                  setDeckName("");
                  setDeckId("");
                  setLimit("10");
                  setStartDate("");
                  setEndDate("");
                  setShowAllRecords(false);
                }}
                className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-zinc-300 cursor-pointer hover:bg-zinc-800"
              >
                Reset Filters
              </Button>
              <Button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (userId) params.set("userId", userId);
                  if (username) params.set("username", username);
                  if (deckName) params.set("deckName", deckName);
                  if (deckId) params.set("deckId", deckId);
                  if (limit) params.set("limit", limit);
                  if (startDate) params.set("startDate", startDate);
                  if (endDate) params.set("endDate", endDate);
                  if (showAllRecords) params.set("showAllRecords", "true");

                  router.push(`?${params.toString()}`);
                  // The useQuery will automatically refetch because the state variables (initialized from URL) 
                  // might not update immediately if we don't sync them. 
                  // Wait, actually, the state IS the source of truth for the inputs. 
                  // But we want the URL to be the source of truth for the PAGE.
                  // For now, let's trust that pushing to router will trigger a re-render if we were using a server component or if we listened to searchParams in useEffect.
                  // Since we initialize from searchParams ONLY ON MOUNT/First Render, we need to ensure the state stays in sync or we rely on the implementation where we manually refetch.
                  // Actually, since we have the state variables in the queryKey, calling refetch() or just updating state is enough for data. 
                  // But for "Back Button" we need URL.
                  // so: 1. Update URL. 2. Refetch happens automatically? NO, only if state changes. 
                  // Initializing state from searchParams only happens once.
                  // So we should just update URL and let the user feel the "Apply". 
                  // Ideally, we should perform the search.
                  refetch();
                }}
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
                {showAllRecords && userId && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 bg-zinc-900 border-zinc-700 text-zinc-300"
                  >
                    ID: {userId}
                  </Badge>
                )}
                {showAllRecords && username && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 bg-zinc-900 border-zinc-700 text-zinc-300"
                  >
                    User: {username}
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
                  {showAllRecords
                    ? "Try changing your filters or adding new records"
                    : "You haven't created any records yet"}
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
      </div>
    </div>
  );
}