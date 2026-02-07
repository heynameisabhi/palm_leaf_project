"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Book,
  User,
  Languages,
  Ruler,
  FileText,
  UserCheck,
  Scissors,
  Loader2,
  AlertCircle,
  Sparkles,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface SearchFilters {
  deckId?: string;
  deckName?: string;
  ownerName?: string;
  lengthMin?: number;
  lengthMax?: number;
  widthMin?: number;
  widthMax?: number;
  stitchType?: string;
  physicalCondition?: string;
  authorName?: string;
  granthaName?: string;
  languageName?: string;
  workedBy?: string;
  searchType: "deck" | "grantha" | "combined";
}

interface Author {
  author_name?: string;
  scribe_name?: string;
}

interface Language {
  language_name?: string;
}

interface ScanningProperties {
  worked_by?: string;
}

interface ScannedImage {
  image_id: string;
  image_name: string;
  scanningProperties?: ScanningProperties;
}

interface GranthaDeck {
  grantha_deck_id: string;
  grantha_deck_name?: string;
  grantha_owner_name?: string;
  length_in_cms?: number;
  width_in_cms?: number;
  stitch_or_nonstitch?: string;
  physical_condition?: string;
  total_leaves?: number;
  total_images?: number;
  user?: any;
}

interface Grantha {
  grantha_id: string;
  grantha_name?: string;
  description?: string;
  remarks?: string;
  author?: Author;
  language?: Language;
  scannedImages?: ScannedImage[];
  granthaDeck?: GranthaDeck;
}

interface SearchResult {
  type: "deck" | "grantha";
  grantha_deck_id?: string;
  grantha_deck_name?: string;
  grantha_owner_name?: string;
  length_in_cms?: number;
  width_in_cms?: number;
  stitch_or_nonstitch?: string;
  physical_condition?: string;
  total_leaves?: number;
  total_images?: number;
  granthas?: Grantha[];
  user?: any;
  grantha_id?: string;
  grantha_name?: string;
  description?: string;
  remarks?: string;
  author?: Author;
  language?: Language;
  scannedImages?: ScannedImage[];
  granthaDeck?: GranthaDeck;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
  filters: SearchFilters;
  fallback?: boolean;
  error?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const ManualManuscriptSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    searchType: "deck",
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedFilters = useDebounce(filters, 300);

  // Perform search
  const performSearch = useCallback(
    async (query: string, searchFilters: SearchFilters) => {
      if (!query.trim() && Object.keys(searchFilters).length <= 1) {
        setResults([]);
        setTotalCount(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Construct query for manual search
        const searchParams = new URLSearchParams();

        // Add main query
        if (query.trim()) {
          searchParams.append("q", query);
        }

        // Add filters
        Object.entries(searchFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value.toString());
          }
        });

        const response = await fetch(`/api/search?${searchParams.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data: SearchResponse = await response.json();
        setResults(data.results);
        setTotalCount(data.count);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An error occurred during search"
        );
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger search when debounced values change
  useEffect(() => {
    performSearch(debouncedSearchQuery, debouncedFilters);
  }, [debouncedSearchQuery, debouncedFilters, performSearch]);

  // Update filter
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ searchType: "deck" });
    setSearchQuery("");
  };

  // Clear individual filter
  const clearFilter = (key: keyof SearchFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  // Active filters count
  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      key !== "searchType" &&
      filters[key as keyof SearchFilters] !== undefined &&
      filters[key as keyof SearchFilters] !== null &&
      filters[key as keyof SearchFilters] !== ""
  ).length;

  const formatDimensions = (length?: number, width?: number): string => {
    if (!length && !width) return "N/A";
    if (!length) return `Width: ${width} cm`;
    if (!width) return `Length: ${length} cm`;
    return `${length} × ${width} cm`;
  };

  const renderDeckResult = (deck: SearchResult): React.ReactElement => (
    <div
      key={deck.grantha_deck_id}
      className="group relative overflow-hidden rounded-2xl bg-black border border-zinc-800 hover:border-green-700 transition-all duration-300 hover:shadow-lg hover:shadow-green-950/20"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950/10 to-green-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-green-950 to-green-800 p-3 rounded-xl">
                <Book className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {deck.grantha_deck_name || "Unnamed Deck"}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-mono bg-black text-green-500 rounded-md border border-green-900/50">
                    <Link
                      href={`/dashboard/data/view/view-grantha-deck/${deck.grantha_deck_id}`}
                    >
                      ID: {deck.grantha_deck_id}
                    </Link>
                  </span>
                  {deck.user && (
                    <span className="px-2 py-1 text-xs bg-blue-950/30 text-blue-400 rounded-md border border-blue-900/50">
                      By: {deck.user.user_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {[
            {
              icon: User,
              label: "Owner",
              value: deck.grantha_owner_name || "N/A",
            },
            {
              icon: Ruler,
              label: "Dimensions",
              value: formatDimensions(deck.length_in_cms, deck.width_in_cms),
            },
            {
              icon: Scissors,
              label: "Stitch Type",
              value: deck.stitch_or_nonstitch || "N/A",
            },
            {
              icon: FileText,
              label: "Condition",
              value: deck.physical_condition || "N/A",
            },
            {
              icon: Book,
              label: "Total Leaves",
              value: deck.total_leaves?.toString() || "N/A",
            },
            {
              icon: FileText,
              label: "Total Images",
              value: deck.total_images?.toString() || "N/A",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-zinc-900 rounded-xl p-3 border border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-green-950 to-green-800 rounded-lg">
                  <item.icon className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-sm font-medium text-zinc-400">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-medium text-white truncate max-w-[120px]">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {deck.granthas && deck.granthas.length > 0 && (
          <div className="border-t border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-r from-green-950 to-green-800 rounded-lg">
                <FileText className="w-4 h-4 text-green-400" />
              </div>
              <h4 className="text-base font-semibold text-white">
                Granthas
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-900/30 text-green-500 rounded-md">
                  {deck.granthas.length}
                </span>
              </h4>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {deck.granthas.map((grantha: Grantha) => (
                <div
                  key={grantha.grantha_id}
                  className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 hover:border-green-900 transition-all duration-300"
                >
                  <div>
                    <h5 className="font-medium text-green-500 text-base mb-2">
                      {grantha.grantha_name || "Unnamed Grantha"}
                    </h5>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {grantha.author && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-black text-zinc-400 rounded-md border border-zinc-800">
                          <User className="w-3 h-3" />
                          {grantha.author.author_name}
                        </span>
                      )}
                      {grantha.language && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-black text-zinc-400 rounded-md border border-zinc-800">
                          <Languages className="w-3 h-3" />
                          {grantha.language.language_name}
                        </span>
                      )}
                    </div>
                    {grantha.description && (
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                        {grantha.description}
                      </p>
                    )}
                    {grantha.remarks && (
                      <p className="text-sm text-zinc-500 mt-1 italic">
                        Remarks: {grantha.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGranthaResult = (grantha: SearchResult): React.ReactElement => (
    <div
      key={grantha.grantha_id}
      className="group relative overflow-hidden rounded-2xl bg-black border border-zinc-800 hover:border-green-700 transition-all duration-300 hover:shadow-lg hover:shadow-green-950/20"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-950/10 to-green-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-r from-green-950 to-green-800 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  <Link
                    href={`/dashboard/data/view/view-grantha/${grantha.grantha_id}`}
                  >
                    {grantha.grantha_name || "Unnamed Grantha"}
                  </Link>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-mono bg-black text-green-500 rounded-md border border-green-900/50">
                    <Link
                      href={`/dashboard/data/view/view-grantha/${grantha.grantha_id}`}
                    >
                      ID: {grantha.grantha_id}
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {[
            grantha.author && {
              icon: User,
              label: "Author",
              value: grantha.author.author_name,
            },
            grantha.author?.scribe_name && {
              icon: User,
              label: "Scribe",
              value: grantha.author.scribe_name,
            },
            grantha.language && {
              icon: Languages,
              label: "Language",
              value: grantha.language.language_name,
            },
            grantha.scannedImages &&
            grantha.scannedImages.length > 0 && {
              icon: FileText,
              label: "Scanned Images",
              value: grantha.scannedImages.length.toString(),
            },
          ]
            .filter(Boolean)
            .map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-zinc-900 rounded-xl p-3 border border-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-r from-green-950 to-green-800 rounded-lg">
                    <item.icon className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-zinc-400">
                    {item.label}
                  </span>
                </div>
                <span className="text-sm font-medium text-white">
                  {item.value}
                </span>
              </div>
            ))}
        </div>

        {grantha.description && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <h4 className="text-sm font-semibold text-green-500 mb-2">
              Description
            </h4>
            <p className="text-zinc-300 leading-relaxed">
              {grantha.description}
            </p>
          </div>
        )}

        {grantha.remarks && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <h4 className="text-sm font-semibold text-green-500 mb-2">
              Remarks
            </h4>
            <p className="text-zinc-300 leading-relaxed italic">
              {grantha.remarks}
            </p>
          </div>
        )}

        {grantha.granthaDeck && (
          <div className="border-t border-zinc-800 pt-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-r from-green-950 to-green-800 rounded-lg">
                <Book className="w-4 h-4 text-green-400" />
              </div>
              <h4 className="text-base font-semibold text-white">
                Deck Information
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  label: "Deck Name",
                  value: grantha.granthaDeck.grantha_deck_name || "N/A",
                },
                {
                  label: "Owner",
                  value: grantha.granthaDeck.grantha_owner_name || "N/A",
                },
                {
                  label: "Dimensions",
                  value: formatDimensions(
                    grantha.granthaDeck.length_in_cms,
                    grantha.granthaDeck.width_in_cms
                  ),
                },
                {
                  label: "Condition",
                  value: grantha.granthaDeck.physical_condition || "N/A",
                },
                {
                  label: "Stitch Type",
                  value: grantha.granthaDeck.stitch_or_nonstitch || "N/A",
                },
                grantha.granthaDeck.user && {
                  label: "Added By",
                  value: grantha.granthaDeck.user.user_name,
                },
              ]
                .filter(Boolean)
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 rounded-xl bg-zinc-900 border border-zinc-800"
                  >
                    <span className="text-sm text-zinc-400">{item.label}:</span>
                    <span className="text-sm font-medium text-green-500">
                      {item.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {grantha.scannedImages && grantha.scannedImages.length > 0 && (
          <div className="border-t border-zinc-800 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-r from-green-950 to-green-800 rounded-lg">
                <FileText className="w-4 h-4 text-green-400" />
              </div>
              <h4 className="text-base font-semibold text-white">
                Scanning Information
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-900/30 text-green-500 rounded-md">
                  {grantha.scannedImages.length}
                </span>
              </h4>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {grantha.scannedImages.slice(0, 5).map((image: ScannedImage) => (
                <div
                  key={image.image_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800"
                >
                  <span className="text-sm font-medium text-green-500 truncate">
                    {image.image_name}
                  </span>
                  {image.scanningProperties?.worked_by && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-black text-zinc-400 rounded-md border border-zinc-800 ml-2">
                      <UserCheck className="w-3 h-3" />
                      {image.scanningProperties.worked_by}
                    </span>
                  )}
                </div>
              ))}
              {grantha.scannedImages.length > 5 && (
                <p className="text-xs text-zinc-500 text-center py-2">
                  ... and {grantha.scannedImages.length - 5} more images
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-green-950/10 to-black pointer-events-none" />

      <div className="relative z-10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-center items-center flex-col text-center mb-16">
            <div className="flex gap-10 justify-center items-center mb-7">
              <div className="p-5 bg-gradient-to-r from-green-950 to-green-600 rounded-2xl flex items-center justify-center">
                <Settings className="h-8 w-8 text-gray-200" />
              </div>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-500 to-white">
                Manual Search
              </h1>
            </div>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Search through our collection of palm leaf manuscripts using
              advanced filters and precise criteria
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-black rounded-2xl border border-zinc-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-950 to-green-600 rounded-xl">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Advanced Manuscript Search
                  </h2>
                  <p className="text-zinc-400">
                    Use filters and search terms to find specific manuscripts
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by deck ID, grantha name, author, language, or deck name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-base bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-green-700 text-white placeholder-zinc-500 transition-all duration-300"
                  />
                </div>

                {/* Search Type Selector */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "deck", label: "Grantha Decks Only" },
                    { value: "grantha", label: "Granthas Only" },
                    { value: "combined", label: "All Results" },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateFilter("searchType", type.value)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${filters.searchType === type.value
                        ? "bg-gradient-to-r from-green-950 to-green-600 text-white"
                        : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                        }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all duration-300 w-full"
                >
                  <div className="p-1.5 bg-gradient-to-r from-green-950 to-green-800 rounded-lg">
                    <Filter className="h-4 w-4 text-green-400" />
                  </div>
                  <span className="text-white font-medium">
                    Advanced Filters
                  </span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      {activeFiltersCount}
                    </span>
                  )}
                  <div className="ml-auto">
                    {showFilters ? (
                      <ChevronUp className="h-5 w-5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                </button>
              </div>

              {error && (
                <div className="mt-5 p-4 bg-red-950/30 border border-red-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <h4 className="font-medium text-red-400">Error</h4>
                      <p className="text-red-500 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-black rounded-2xl border border-zinc-800 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Search Filters
                  </h3>
                  <button
                    onClick={clearFilters}
                    className="text-zinc-400 hover:text-white transition-colors duration-300 px-3 py-1 rounded-lg hover:bg-zinc-800"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Deck ID */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Grantha Deck ID
                    </label>
                    <input
                      type="text"
                      placeholder="Enter deck ID"
                      value={filters.deckId || ""}
                      onChange={(e) => updateFilter("deckId", e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    />
                  </div>

                  {/* Deck Name */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Grantha Deck Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter deck name"
                      value={filters.deckName || ""}
                      onChange={(e) => updateFilter("deckName", e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    />
                  </div>

                  {/* Owner Name */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter owner name"
                      value={filters.ownerName || ""}
                      onChange={(e) =>
                        updateFilter("ownerName", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    />
                  </div>

                  {/* Author Name */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Author Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter author name"
                      value={filters.authorName || ""}
                      onChange={(e) =>
                        updateFilter("authorName", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    />
                  </div>

                  {/* Grantha Name */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Grantha Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter manuscript name"
                      value={filters.granthaName || ""}
                      onChange={(e) =>
                        updateFilter("granthaName", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    />
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Language/Script
                    </label>
                    <input
                      type="text"
                      placeholder="Enter language or script"
                      value={filters.languageName || ""}
                      onChange={(e) =>
                        updateFilter("languageName", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    />
                  </div>

                  {/* Worked By */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Worked By
                    </label>
                    <input
                      type="text"
                      placeholder="Enter worker name"
                      value={filters.workedBy || ""}
                      onChange={(e) => updateFilter("workedBy", e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    />
                  </div>

                  {/* Physical Condition */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Physical Condition
                    </label>
                    <select
                      value={filters.physicalCondition || ""}
                      onChange={(e) =>
                        updateFilter("physicalCondition", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    >
                      <option value="">All Conditions</option>
                      <option value="good">Good</option>
                      <option value="medium">Medium</option>
                      <option value="bad">Bad</option>
                      <option value="very bad">Very Bad</option>
                    </select>
                  </div>

                  {/* Stitch Type */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Stitch Type
                    </label>
                    <select
                      value={filters.stitchType || ""}
                      onChange={(e) =>
                        updateFilter("stitchType", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                    >
                      <option value="">All Types</option>
                      <option value="stitch">Stitched</option>
                      <option value="non stitch">Non Stitch</option>
                    </select>
                  </div>

                  {/* Length Range */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Length Range (cm)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.lengthMin || ""}
                        onChange={(e) =>
                          updateFilter(
                            "lengthMin",
                            e.target.value
                              ? Number.parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.lengthMax || ""}
                        onChange={(e) =>
                          updateFilter(
                            "lengthMax",
                            e.target.value
                              ? Number.parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Width Range */}
                  <div>
                    <label className="block text-sm font-medium text-green-500 mb-2">
                      Width Range (cm)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.widthMin || ""}
                        onChange={(e) =>
                          updateFilter(
                            "widthMin",
                            e.target.value
                              ? Number.parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.widthMax || ""}
                        onChange={(e) =>
                          updateFilter(
                            "widthMax",
                            e.target.value
                              ? Number.parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        className="w-1/2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700 transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Filters */}
                {activeFiltersCount > 0 && (
                  <div className="mt-6 pt-6 border-t border-zinc-800">
                    <h4 className="text-sm font-semibold text-green-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Active Filters ({activeFiltersCount})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(filters).map(([key, value]) => {
                        if (key === "searchType" || !value) return null;
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center px-3 py-1 bg-green-900/30 text-green-400 rounded-lg text-sm border border-green-800"
                          >
                            {key}: {value.toString()}
                            <button
                              onClick={() =>
                                clearFilter(key as keyof SearchFilters)
                              }
                              className="ml-2 hover:text-green-300 transition-colors cursor-pointer duration-200"
                            >
                              <X className="h-3 w-3 text-white" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                <span className="text-xl text-zinc-400">
                  Searching manuscripts...
                </span>
              </div>
            </div>
          )}

          {/* Results */}
          {!loading && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 p-6 bg-black rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-green-950 to-green-600 rounded-xl">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Search Results
                    </h2>
                    <p className="text-zinc-400">
                      Found {totalCount} result
                      {totalCount !== 1 ? "s" : ""}{" "}
                      {searchQuery && `for "${searchQuery}"`}
                    </p>
                  </div>
                </div>
              </div>

              {results.length === 0 &&
                (searchQuery || activeFiltersCount > 0) ? (
                <div className="text-center py-16 bg-black rounded-2xl border border-zinc-800">
                  <div className="inline-block mb-6 p-6 bg-gradient-to-r from-green-950 to-green-600 rounded-full">
                    <Book className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No manuscripts found
                  </h3>
                  <p className="text-zinc-400 text-lg mb-2">
                    No manuscripts match your current search criteria.
                  </p>
                  <p className="text-zinc-500">
                    Try adjusting your search terms or filters.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {results.map((result: SearchResult, index) =>
                    result.type === "deck"
                      ? renderDeckResult(result)
                      : renderGranthaResult(result)
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(24, 24, 27, 0.6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(22, 101, 52, 0.8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(22, 101, 52, 1);
        }
      `}</style>
    </div>
  );
};

export default ManualManuscriptSearch;
