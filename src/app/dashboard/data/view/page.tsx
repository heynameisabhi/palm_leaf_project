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
import {
  AlertCircle,
  Filter,
  RefreshCw,
  Search,
  User,
  Database,
  Edit,
  Eye,
  Trash2,
  Book,
  Users,
  Calendar,
  BookOpen,
  Globe,
  Layers
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { formatTimeAgo } from "@/helpers/formatTime";
import { Prisma } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "sonner";

type GranthaDeckWithCount = Prisma.GranthaDeckGetPayload<{
  include: {
    _count: { select: { granthas: true } };
    user: { select: { name: true; email: true } };
  };
}>;

interface Author {
  author_id: string;
  author_name: string | null;
  birth_year: string | null;
  death_year: string | null;
  bio: string | null;
  scribe_name: string | null;
  _count?: {
    granthas: number;
  };
}

interface Language {
  language_id: string;
  language_name: string | null;
}

interface GranthaDeckInfo {
  grantha_deck_id: string;
  grantha_deck_name: string | null;
  grantha_owner_name: string | null;
}

interface AuthorInfo {
  author_id: string;
  author_name: string | null;
  birth_year: string | null;
  death_year: string | null;
}

interface Grantha {
  grantha_id: string;
  grantha_name: string | null;
  description: string | null;
  remarks: string | null;
  author: AuthorInfo;
  language: Language;
  granthaDeck: GranthaDeckInfo;
  _count: {
    scannedImages: number;
  };
}

export default function MergedDataViewer() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("decks");

  // Grantha Deck states
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [deckName, setDeckName] = useState("");
  const [deckId, setDeckId] = useState("");
  const [limit, setLimit] = useState("10");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Delete modal states for decks
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<GranthaDeckWithCount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete modal states for authors
  const [isDeleteAuthorModalOpen, setIsDeleteAuthorModalOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);
  const [isDeletingAuthor, setIsDeletingAuthor] = useState(false);

  // Fetch Grantha Decks
  const fetchGranthaDecks = async () => {
    const queryParams = new URLSearchParams({
      userId: showAllRecords ? (userId || "") : (session?.user?.id || ""),
      username: username || "",
      deckName: deckName || "",
      deckId: deckId || "",
      limit: limit ? limit.toString() : "10",
    }).toString();

    const response = await axios.get(`/api/user/view-records?${queryParams}`);
    return response.data;
  };

  const {
    data: decksData,
    isLoading: decksLoading,
    isError: decksError,
    error: decksErrorObj,
    refetch: refetchDecks,
  } = useQuery({
    queryKey: ["grantha-decks", userId, username, deckName, deckId, limit, showAllRecords],
    queryFn: fetchGranthaDecks,
    enabled: !!session && activeTab === "decks",
  });

  // Fetch Authors
  const {
    data: authorsData,
    isLoading: authorsLoading,
    isError: authorsError,
    refetch: refetchAuthors,
  } = useQuery({
    queryKey: ["authors"],
    queryFn: async () => {
      const response = await axios.get("/api/authors");
      return response.data;
    },
    enabled: activeTab === "authors",
  });

  // Fetch Granths
  const {
    data: granthsData,
    isLoading: granthsLoading,
    isError: granthsError,
    refetch: refetchGranths,
  } = useQuery({
    queryKey: ["granths"],
    queryFn: async () => {
      const response = await axios.get("/api/granths?limit=100");
      return response.data;
    },
    enabled: activeTab === "granths",
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
      await refetchDecks();
      setIsDeleteModalOpen(false);
      setDeckToDelete(null);
      toast.success(`Deck ${deckToDelete.grantha_deck_id} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error(`Failed to delete deck ${deckToDelete?.grantha_deck_name}. Please try again.`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeckToDelete(null);
  };

  const handleDeleteAuthorClick = (author: Author) => {
    setAuthorToDelete(author);
    setIsDeleteAuthorModalOpen(true);
  };

  const handleDeleteAuthorConfirm = async () => {
    if (!authorToDelete) return;

    setIsDeletingAuthor(true);
    try {
      await axios.delete(`/api/grantha-authors/${authorToDelete.author_id}`);
      await refetchAuthors();
      setIsDeleteAuthorModalOpen(false);
      setAuthorToDelete(null);
      toast.success(`Author ${authorToDelete.author_name} deleted successfully.`);
    } catch (error: any) {
      console.error("Error deleting author:", error);
      toast.error(error.response?.data || `Failed to delete author ${authorToDelete?.author_name}. Please try again.`);
    } finally {
      setIsDeletingAuthor(false);
    }
  };

  const handleDeleteAuthorCancel = () => {
    setIsDeleteAuthorModalOpen(false);
    setAuthorToDelete(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-200">Data Viewer</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your data records
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
            <TabsTrigger value="decks" className="data-[state=active]:bg-zinc-800 text-white">
              <Layers className="h-4 w-4 mr-2" />
              Grantha Decks
            </TabsTrigger>
            <TabsTrigger value="authors" className="data-[state=active]:bg-zinc-800 text-white">
              <Users className="h-4 w-4 mr-2" />
              Authors
            </TabsTrigger>
            {/* <TabsTrigger value="granths" className="data-[state=active]:bg-zinc-800 text-white">
              <Book className="h-4 w-4 mr-2" />
              Granths
            </TabsTrigger> */}
          </TabsList>

          {/* Grantha Decks Tab */}
          <TabsContent value="decks" className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <p className="text-sm text-muted-foreground">
                My Grantha Deck Records
              </p>
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
                  onClick={() => refetchDecks()}
                  variant="secondary"
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {isFilterOpen && (
              <Card className="bg-zinc-950 border-zinc-800 mb-6">
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

                    {showAllRecords && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="userId" className="text-sm font-medium text-zinc-300">
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
                          <label htmlFor="username" className="text-sm font-medium text-zinc-300">
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
                        <div className="space-y-2">
                          <label htmlFor="deckName" className="text-sm font-medium text-zinc-300">
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
                          <label htmlFor="deckId" className="text-sm font-medium text-zinc-300">
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
                          <label htmlFor="limit" className="text-sm font-medium text-zinc-300">
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
                      </div>
                    )}
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
                      setShowAllRecords(false);
                    }}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-zinc-300 cursor-pointer hover:bg-zinc-800"
                  >
                    Reset Filters
                  </Button>
                  <Button
                    onClick={() => refetchDecks()}
                    className="bg-white hover:bg-zinc-200 text-black"
                  >
                    Apply Filters
                  </Button>
                </CardFooter>
              </Card>
            )}

            {decksLoading ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: Number.parseInt(limit) || 3 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden bg-zinc-900 border-zinc-800">
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
            ) : decksError ? (
              <Alert variant="destructive" className="bg-zinc-900 border-red-900 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {decksErrorObj instanceof Error ? decksErrorObj.message : "Failed to load data"}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {decksData?.granthaDeckRecords?.length || 0} records
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
                      <Badge variant="outline" className="flex items-center gap-1 bg-zinc-900 border-zinc-700 text-zinc-300">
                        ID: {userId}
                      </Badge>
                    )}
                    {showAllRecords && username && (
                      <Badge variant="outline" className="flex items-center gap-1 bg-zinc-900 border-zinc-700 text-zinc-300">
                        User: {username}
                      </Badge>
                    )}
                  </div>
                </div>

                {decksData?.granthaDeckRecords?.length > 0 ? (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {decksData.granthaDeckRecords.map((deck: GranthaDeckWithCount) => (
                        <Card
                          key={deck.grantha_deck_id}
                          className="overflow-hidden hover:shadow-md transition-all bg-zinc-900 border-zinc-800 group"
                        >
                          <CardHeader>
                            <CardTitle className="text-zinc-200 group-hover:text-white transition-colors">
                              {deck.grantha_deck_name || `Deck ${deck.grantha_deck_id.substring(0, 8)}`}
                            </CardTitle>
                            <CardDescription className="flex justify-between items-center text-zinc-400">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {deck.user?.name || deck.user_id.substring(0, 8)}
                              </span>
                              <span className="text-xs">{formatTimeAgo(new Date(deck.createdAt))}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-400">
                                Granthas: {deck._count.granthas}
                              </span>
                              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
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
                        {decksData.granthaDeckRecords.map((deck: GranthaDeckWithCount) => (
                          <div
                            key={deck.grantha_deck_id}
                            className="grid grid-cols-6 gap-4 p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                          >
                            <div className="text-zinc-300">
                              {deck.grantha_deck_name || `Deck ${deck.grantha_deck_id.substring(0, 8)}`}
                            </div>
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
                                    onClick={() =>
                                      router.push(`/dashboard/data/view/edit-grantha-deck/${deck.grantha_deck_id}`)
                                    }
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
                    <h3 className="text-lg font-medium text-zinc-300">No records found</h3>
                    <p className="text-zinc-400 mt-1">
                      {showAllRecords
                        ? "Try changing your filters or adding new records"
                        : "You haven't created any records yet"}
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Authors Tab */}
          <TabsContent value="authors" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {authorsData?.authors?.length || 0} authors
              </p>
              <Button
                onClick={() => refetchAuthors()}
                variant="secondary"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {authorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 bg-zinc-800" />
                      <Skeleton className="h-4 w-1/2 mt-2 bg-zinc-800" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-zinc-800" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : authorsError ? (
              <Alert variant="destructive" className="bg-zinc-900 border-red-900 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load authors</AlertDescription>
              </Alert>
            ) : authorsData?.authors?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {authorsData.authors.map((author: Author) => (
                  <Card
                    key={author.author_id}
                    className="overflow-hidden hover:shadow-md transition-all bg-zinc-900 border-zinc-800 group"
                  >
                    <CardHeader>
                      <CardTitle className="text-zinc-200 group-hover:text-white transition-colors flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {author.author_name || "Unknown Author"}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 text-xs">
                        ID: {author.author_id.substring(0, 8)}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(author.birth_year || author.death_year) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          <span className="text-zinc-300">
                            {author.birth_year || "?"} - {author.death_year || "?"}
                          </span>
                        </div>
                      )}

                      {author.scribe_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-3 w-3 text-zinc-500" />
                          <span className="text-zinc-300">Scribe: {author.scribe_name}</span>
                        </div>
                      )}

                      {author.bio && (
                        <div className="mt-3">
                          <p className="text-xs text-zinc-400 line-clamp-3">{author.bio}</p>
                        </div>
                      )}

                      {author._count && (
                        <div className="flex justify-between items-center pt-2">
                          <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300">
                            {author._count.granthas} granths
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/data/insert/edit-author/${author.author_id}`)}
                        className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAuthorClick(author)}
                        className="bg-zinc-800 border-zinc-700 hover:bg-red-800 hover:border-red-700 text-zinc-300 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-zinc-300">
                  No authors found
                </h3>
                <p className="text-zinc-400 mt-1">
                  No authors available in the system
                </p>
              </div>
            )}
          </TabsContent>

          {/* Granths Tab */}
          <TabsContent value="granths" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {granthsData?.granths?.length || 0} of {granthsData?.totalCount || 0} granths
              </p>
              <Button
                onClick={() => refetchGranths()}
                variant="secondary"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {granthsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 bg-zinc-800" />
                      <Skeleton className="h-4 w-1/2 mt-2 bg-zinc-800" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-zinc-800" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : granthsError ? (
              <Alert variant="destructive" className="bg-zinc-900 border-red-900 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to load granths</AlertDescription>
              </Alert>
            ) : granthsData?.granths?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {granthsData.granths.map((grantha: Grantha) => (
                  <Card
                    key={grantha.grantha_id}
                    className="overflow-hidden hover:shadow-md transition-all bg-zinc-900 border-zinc-800 group"
                  >
                    <CardHeader>
                      <CardTitle className="text-zinc-200 group-hover:text-white transition-colors flex items-center gap-2">
                        <Book className="h-4 w-4" />
                        {grantha.grantha_name || `Grantha ${grantha.grantha_id.substring(0, 8)}`}
                      </CardTitle>
                      <CardDescription className="text-zinc-400 text-xs">
                        ID: {grantha.grantha_id}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-3 w-3 text-zinc-500" />
                        <span className="text-zinc-300">
                          {grantha.author.author_name || "Unknown Author"}
                        </span>
                        {grantha.author.birth_year && grantha.author.death_year && (
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
                            {grantha.author.birth_year}-{grantha.author.death_year}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-3 w-3 text-zinc-500" />
                        <span className="text-zinc-300">
                          {grantha.language.language_name || "Unknown Language"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Database className="h-3 w-3 text-zinc-500" />
                        <span className="text-zinc-300 truncate">
                          {grantha.granthaDeck.grantha_deck_name || `Deck ${grantha.granthaDeck.grantha_deck_id.substring(0, 8)}`}
                        </span>
                      </div>

                      {grantha.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {grantha.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-300">
                          {grantha._count.scannedImages} images
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-zinc-300">
                  No granths found
                </h3>
                <p className="text-zinc-400 mt-1">
                  No granths available in the system yet
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Modal for Grantha Decks */}
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

        {/* Delete Confirmation Modal for Authors */}
        <ConfirmationModal
          isOpen={isDeleteAuthorModalOpen}
          onClose={handleDeleteAuthorCancel}
          onConfirm={handleDeleteAuthorConfirm}
          title="Delete Author"
          message={
            authorToDelete
              ? `Are you sure you want to delete "${authorToDelete.author_name || 'Unknown Author'}"? ${authorToDelete._count?.granthas ? `This author has ${authorToDelete._count.granthas} associated granth(s). You must remove or reassign them first.` : 'This action cannot be undone.'}`
              : "Are you sure you want to delete this author?"
          }
          confirmButtonText="Delete Author"
          cancelButtonText="Cancel"
          isLoading={isDeletingAuthor}
          variant="danger"
        />
      </div>
    </div>
  );
}