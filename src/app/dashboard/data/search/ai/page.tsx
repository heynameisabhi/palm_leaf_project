"use client";

import type React from "react";
import { useState } from "react";
import {
  Search,
  Book,
  User,
  Ruler,
  FileText,
  Languages,
  UserCheck,
  Scissors,
  Loader2,
  AlertCircle,
  Sparkles,
  Brain,
  Bot,
  Cpu,
  Workflow,
  Activity,
  CircuitBoard,
} from "lucide-react";
import axios from "axios";

// Type definitions
interface Author {
  author_name: string;
}

interface Language {
  language_name: string;
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
}

interface Grantha {
  grantha_id: string;
  grantha_name?: string;
  description?: string;
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
  grantha_id?: string;
  grantha_name?: string;
  description?: string;
  author?: Author;
  language?: Language;
  scannedImages?: ScannedImage[];
  granthaDeck?: GranthaDeck;
}

interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
  fallback?: boolean;
  searchStrategy?: any;
}

export default function SearchPage(): JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const searchManuscripts = async (): Promise<void> => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post<SearchResponse>(
        "/api/ai/search/",
        {
          query: query.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setResults(response.data);
    } catch (err) {
      setError("Failed to search manuscripts. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      searchManuscripts();
    }
  };

  const formatDimensions = (length?: number, width?: number): string => {
    if (!length && !width) return "N/A";
    if (!length) return `Width: ${width} cm`;
    if (!width) return `Length: ${length} cm`;
    return `${length} × ${width} cm`;
  };

  const renderDeckResult = (deck: SearchResult): JSX.Element => (
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
                    ID: {deck.grantha_deck_id}
                  </span>
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
                    <div className="flex flex-wrap gap-2">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGranthaResult = (grantha: SearchResult): JSX.Element => (
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
                  {grantha.grantha_name || "Unnamed Grantha"}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-mono bg-black text-green-500 rounded-md border border-green-900/50">
                    ID: {grantha.grantha_id}
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
            <p className="text-zinc-300 leading-relaxed">
              {grantha.description}
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
              ].map((item, index) => (
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
            <div className="flex gap-10 justify-center items-center mb-7    ">
              <div className="p-5 bg-gradient-to-r from-green-950 to-green-600 rounded-2xl flex items-center justify-center">
                <Brain className="h-8 w-8 text-gray-200" />
              </div>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-500 to-white">
                AI Search
              </h1>
            </div>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Search through our collection of palm leaf manuscripts using
              natural language queries
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
                    Manuscript Search
                  </h2>
                  <p className="text-zinc-400">
                    Enter your search query to find manuscripts in our
                    collection
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  searchManuscripts();
                }}
                className="space-y-5"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your search query..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-12 pr-4 py-3 text-base bg-zinc-900 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-green-700 focus:border-green-700 text-white placeholder-zinc-500 transition-all duration-300"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-950 to-green-600 hover:from-green-900 hover:to-green-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching manuscripts...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Search className="w-5 h-5" />
                      Search Manuscripts
                    </div>
                  )}
                </button>
              </form>

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

          {/* Example Queries */}
          <div className="max-w-4xl mx-auto mb-12">
            <h3 className="text-sm font-semibold text-green-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Example searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Find manuscripts by author Raghavan",
                "Show manuscripts with stitch type as just non-stitch",
                "Large manuscripts over length 50cm",
                "Show manuscripts between width 3cm-4cm",
                "Sanskrit manuscripts",
                "Manuscripts in bad condition",
                "Show all manuscripts",
                "Show all grantha decks inserted by the user with user_name test"
              ].map((example: string) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="px-3 py-2 text-sm bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg hover:bg-green-950 hover:border-green-800 hover:text-white transition-all duration-300"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {results && !loading && (
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
                      Found {results.count} result
                      {results.count !== 1 ? "s" : ""} for "{results.query}"
                    </p>
                  </div>
                </div>

                {results.fallback && (
                  <div className="mb-5 p-4 bg-yellow-950/30 border border-yellow-900/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <h4 className="font-medium text-yellow-400">
                          Fallback Search
                        </h4>
                        <p className="text-yellow-500 text-sm">
                          Using fallback search due to AI processing error
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {results.searchStrategy && (
                  <details className="group">
                    <summary className="text-sm text-green-500 cursor-pointer hover:text-green-400 transition-colors duration-200 flex items-center gap-2">
                      <span className="transform group-open:rotate-90 transition-transform duration-200">
                        ▶
                      </span>
                      Show search strategy
                    </summary>
                    <div className="mt-4 p-4 bg-zinc-900 rounded-xl border border-zinc-800 max-h-64 overflow-auto custom-scrollbar">
                      <pre className="text-xs text-zinc-300 font-mono">
                        {JSON.stringify(results.searchStrategy, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>

              {results.results && results.results.length > 0 ? (
                <div className="grid gap-6">
                  {results.results.map((result: SearchResult) =>
                    result.type === "deck"
                      ? renderDeckResult(result)
                      : renderGranthaResult(result)
                  )}
                </div>
              ) : (
                <div className="text-center py-16 bg-black rounded-2xl border border-zinc-800">
                  <div className="inline-block mb-6 p-6 bg-gradient-to-r from-green-950 to-green-600 rounded-full">
                    <Book className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    No manuscripts found
                  </h3>
                  <p className="text-zinc-400 text-lg">
                    Try adjusting your search query or using different keywords.
                  </p>
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
}
