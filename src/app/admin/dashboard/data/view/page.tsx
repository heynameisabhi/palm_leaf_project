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
import { AlertCircle, Filter, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatTimeAgo } from "@/helpers/formatTime";
import { GranthaDeck, Prisma } from "@prisma/client";

type GranthaDeckWithCount = Prisma.GranthaDeckGetPayload<{
    include: { _count: { select: { granthas: true } } }
  }>;
  

export default function GranthaDeckViewer() {
  const [userId, setUserId] = useState("");
  const [limit, setLimit] = useState("10");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchGranthaDecks = async () => {
    const queryParams = new URLSearchParams({
      userId: userId || "",
      limit: limit ? limit.toString() : "10",
    }).toString();

    const response = await axios.get(`/api/admin/view-records?${queryParams}`);
    return response.data;
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["grantha-decks", userId, limit],
    queryFn: fetchGranthaDecks,
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-400">
              Grantha Deck Records
            </h1>
            <p className="text-muted-foreground mt-1">
              View and filter your Grantha Deck data
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              <Filter className="h-4 w-4" />
              Filters
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="userId"
                    className="text-sm font-medium text-zinc-300"
                  >
                    User ID
                  </label>
                  <Input
                    id="userId"
                    placeholder="Filter by user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300"
                  />
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
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => refetch()}
                className="ml-auto bg-white hover:bg-zinc-400 text-black"
              >
                Apply Filters
              </Button>
            </CardFooter>
          </Card>
        )}

        {isLoading ? (
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
              {userId && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 bg-zinc-900 border-zinc-700 text-zinc-300"
                >
                  Filtered by user: {userId}
                </Badge>
              )}
            </div>

            {data?.granthaDeckRecords?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.granthaDeckRecords.map((deck: GranthaDeckWithCount) => (
                  <Card
                    key={deck.grantha_deck_id}
                    className="overflow-hidden hover:shadow-md transition-shadow bg-zinc-900 border-zinc-800"
                  >
                    <CardHeader>
                      <CardTitle className="text-zinc-200">
                        {deck.grantha_deck_name ||
                          `Deck ${deck.grantha_deck_id.substring(0, 8)}`}
                      </CardTitle>
                      <CardDescription className="flex justify-between items-center text-zinc-400">
                        <span>User: {deck.user_id.substring(0, 8)}...</span>
                        <span className="text-xs">
                          {formatTimeAgo(new Date(deck.createdAt))}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-xs text-zinc-400">
                        Granthas: {deck._count.granthas}
                      </span>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-zinc-800 border-zinc-700 cursor-pointer hover:bg-zinc-700 text-zinc-300"
                      >
                        View Details
                      </Button>
                      <Badge
                        variant="secondary"
                        className="bg-zinc-800 text-zinc-300"
                      >
                        ID: {deck.grantha_deck_id.substring(0, 6)}
                      </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
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
      </div>
    </div>
  );
}
