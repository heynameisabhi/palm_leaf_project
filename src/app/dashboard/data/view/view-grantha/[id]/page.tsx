"use client";

import { useState, useEffect, use } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
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
  User,
  Languages,
  BookMarked,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Info,
  Trash2,
} from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "sonner";

type ScannedImage = {
  image_id: string;
  image_name: string;
  image_url: string;
  scanningProperties?: {
    scan_id?: string;
    resolution_dpi?: string;
    file_format?: string;
    worked_by?: string;
    scanner_model?: string;
    color_depth?: string;
    scanning_start_date?: string;
    scanning_completed_date?: string;
    post_scanning_completed_date?: string;
    lighting_conditions?: string;
    horizontal_or_vertical_scan?: string;
  };
};

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
  scannedImages?: ScannedImage[];
};

interface PageParams {
  params: Promise<{
    id: string;
  }>;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ScannedImage[];
  initialIndex: number;
}

function ImageModal({
  isOpen,
  onClose,
  images,
  initialIndex,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          prevImage();
          break;
        case "ArrowRight":
          event.preventDefault();
          nextImage();
          break;
        case "Escape":
          event.preventDefault();
          onClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]); // Dependencies for the effect

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentIndex];

  const getImageUrl = (imagePath: string) => {
    const isTiff =
      imagePath.toLowerCase().endsWith(".tif") ||
      imagePath.toLowerCase().endsWith(".tiff");

    if (isTiff) {
      return `/api/images?path=${encodeURIComponent(imagePath)}&format=jpeg`;
    }

    return `/api/images?path=${encodeURIComponent(imagePath)}`;
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setRotation(0);
    setImageLoading(true);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
    setImageLoading(true);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = async () => {
    try {
      const response = await fetch(getImageUrl(currentImage.image_url));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentImage.image_name || `image-${currentIndex + 1}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="fixed overflow-auto inset-0 z-50 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-900/50 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">
              {currentImage.image_name || `Image ${currentIndex + 1}`}
            </h2>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
              {currentIndex + 1} of {images.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Keyboard hint */}
            {images.length > 1 && (
              <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 mr-4">
                <span>Use</span>
                <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                  ←
                </kbd>
                <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                  →
                </kbd>
                <span>to navigate</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Image Area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border-zinc-700 cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border-zinc-700 cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
              </>
            )}

            {/* Image Container */}
            <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
              <div
                className="relative max-w-full max-h-full transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center",
                }}
              >
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-lg">
                    <Skeleton className="w-96 h-96 bg-zinc-800" />
                  </div>
                )}
                <img
                  src={getImageUrl(currentImage.image_url)}
                  alt={currentImage.image_name || `Image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                  style={{
                    display: imageLoading ? "none" : "block",
                  }}
                />
              </div>
            </div>

            {/* Control Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 border border-zinc-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-zinc-300 px-2 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-zinc-600 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
                className="text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Details Panel */}
          {showDetails && (
            <div className="w-96 bg-zinc-900/50 border-l border-zinc-800 p-4 overflow-y-auto">
              <Card className="bg-zinc-950/50 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">
                    Image Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-2">
                      Basic Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Name:</span>
                        <span className="text-zinc-300">
                          {currentImage.image_name || "Unnamed"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">ID:</span>
                        <span className="text-zinc-300 font-mono text-xs">
                          {currentImage.image_id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  {currentImage.scanningProperties && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-2">
                        Scanning Properties
                      </h4>
                      <div className="space-y-2 text-sm">
                        {currentImage.scanningProperties.scan_id && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Scan ID:</span>
                            <span className="text-zinc-300">
                              {currentImage.scanningProperties.scan_id.substring(
                                0,
                                8
                              )}
                              ...
                            </span>
                          </div>
                        )}
                        {currentImage.scanningProperties.resolution_dpi && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Resolution:</span>
                            <span className="text-zinc-300">
                              {currentImage.scanningProperties.resolution_dpi}
                            </span>
                          </div>
                        )}
                        {currentImage.scanningProperties.file_format && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Format:</span>
                            <span className="text-zinc-300">
                              {currentImage.scanningProperties.file_format}
                            </span>
                          </div>
                        )}
                        {currentImage.scanningProperties
                          .horizontal_or_vertical_scan && (
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Scan Type:</span>
                              <span className="text-zinc-300">
                                {
                                  currentImage.scanningProperties
                                    .horizontal_or_vertical_scan
                                }
                              </span>
                            </div>
                          )}
                        {currentImage.scanningProperties.worked_by && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Worked By:</span>
                            <span className="text-zinc-300">
                              {currentImage.scanningProperties.worked_by}
                            </span>
                          </div>
                        )}
                        {currentImage.scanningProperties.scanner_model && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">
                              Scanner model:
                            </span>
                            <span className="text-zinc-300">
                              {currentImage.scanningProperties.scanner_model}
                            </span>
                          </div>
                        )}
                        {currentImage.scanningProperties.color_depth && (
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Color Depth:</span>
                            <span className="text-zinc-300">
                              {currentImage.scanningProperties.color_depth}
                            </span>
                          </div>
                        )}
                        {currentImage.scanningProperties
                          .lighting_conditions && (
                            <div className="flex justify-between">
                              <span className="text-zinc-500">
                                Lighting Condition:
                              </span>
                              <span className="text-zinc-300">
                                {
                                  currentImage.scanningProperties
                                    .lighting_conditions
                                }
                              </span>
                            </div>
                          )}
                        {currentImage.scanningProperties
                          .scanning_start_date && (
                            <div className="flex justify-between">
                              <span className="text-zinc-500">
                                Scanning Start Date:
                              </span>
                              <span className="text-zinc-300">
                                {
                                  currentImage.scanningProperties
                                    .scanning_start_date
                                }
                              </span>
                            </div>
                          )}
                        {currentImage.scanningProperties
                          .scanning_completed_date && (
                            <div className="flex justify-between">
                              <span className="text-zinc-500">
                                Scanning Completed Date:
                              </span>
                              <span className="text-zinc-300">
                                {
                                  currentImage.scanningProperties
                                    .scanning_completed_date
                                }
                              </span>
                            </div>
                          )}
                        {currentImage.scanningProperties
                          .post_scanning_completed_date && (
                            <div className="flex justify-between">
                              <span className="text-zinc-500">
                                Post Scanning Completed Date:
                              </span>
                              <span className="text-zinc-300">
                                {
                                  currentImage.scanningProperties
                                    .post_scanning_completed_date
                                }
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="border-t border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
              {images.map((image, index) => (
                <div
                  key={image.image_id}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoom(1);
                    setRotation(0);
                    setImageLoading(true);
                  }}
                  className={`relative w-16 h-16 rounded-md overflow-hidden cursor-pointer flex-shrink-0 transition-all ${currentIndex === index
                      ? "ring-2 ring-white"
                      : "opacity-70 hover:opacity-100"
                    }`}
                >
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${getImageUrl(image.image_url)}')`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GranthaViewPage({ params }: PageParams) {
  const resolvedParams = use(params);
  const granthaId = resolvedParams.id;
  const router = useRouter();
  const { data: session } = useSession();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Delete grantha modal states
  const [isGranthaDeleteModalOpen, setIsGranthaDeleteModalOpen] =
    useState(false);
  const [isDeletingGrantha, setIsDeletingGrantha] = useState(false);

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

  const handleGranthaDeleteClick = () => {
    setIsGranthaDeleteModalOpen(true);
  };

  const handleGranthaDeleteConfirm = async () => {
    if (!grantha) return;

    setIsDeletingGrantha(true);
    try {
      const response = await axios.delete(
        `/api/user/delete-grantha/${grantha.grantha_id}`
      );

      // Close modal
      setIsGranthaDeleteModalOpen(false);

      // Show success message with details from API response
      const deletedData = response.data.deletedGrantha;
      toast.success(
        `Grantha "${deletedData.name ||
        grantha.grantha_name ||
        grantha.grantha_id.substring(0, 8)
        }" deleted successfully. ${deletedData.deletedImagesCount > 0
          ? `${deletedData.deletedImagesCount} associated images were also deleted.`
          : ""
        }`
      );

      // Navigate back to the deck view
      router.push(
        `/dashboard/data/view/view-grantha-deck/${grantha.grantha_deck_id}`
      );
    } catch (error) {
      console.error("Error deleting grantha:", error);
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error ||
          "Failed to delete grantha. Please try again.";
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
    const isTiff =
      imagePath.toLowerCase().endsWith(".tif") ||
      imagePath.toLowerCase().endsWith(".tiff");

    // If it's a TIFF, explicitly request JPEG conversion
    if (isTiff) {
      return `/api/images?path=${encodeURIComponent(imagePath)}&format=jpeg`;
    }

    // For other formats, let the API handle automatic format detection
    return `/api/images?path=${encodeURIComponent(imagePath)}`;
  };

  const openModal = (index: number) => {
    setActiveImageIndex(index);
    setIsModalOpen(true);
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
              {grantha.grantha_name ||
                `Grantha ${grantha.grantha_id.substring(0, 8)}`}
            </h1>
            <p className="text-muted-foreground text-sm">
              From deck{" "}
              <span
                className="underline cursor-pointer hover:text-white"
                onClick={() =>
                  router.push(
                    `/dashboard/data/view/view-grantha-deck/${grantha.grantha_deck_id}`
                  )
                }
              >
                {grantha.granthaDeck.grantha_deck_name ||
                  `Deck ${grantha.grantha_deck_id.substring(0, 8)}`}
              </span>
            </p>
          </div>

          {isOwner && (
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    `/dashboard/data/view/edit-grantha/${grantha.grantha_id}`
                  )
                }
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white text-zinc-300 h-8"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Grantha
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGranthaDeleteClick}
                className="bg-zinc-800 border-zinc-700 hover:bg-red-800 hover:border-red-700 text-zinc-300 hover:text-red-300 h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Grantha
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {grantha.description && (
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 whitespace-pre-wrap">
                    {grantha.description}
                  </p>
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
                    <h3 className="text-sm font-medium text-zinc-400">
                      Grantha ID
                    </h3>
                    <p className="text-zinc-300 mt-1">{grantha.grantha_id}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">
                      Author
                    </h3>
                    <p className="text-zinc-300 mt-1">
                      {grantha.author.author_name || "Not specified"}
                    </p>
                    {grantha.author.birth_year && grantha.author.death_year && (
                      <p className="text-xs text-zinc-500">
                        ({grantha.author.birth_year} -{" "}
                        {grantha.author.death_year})
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">
                      Language
                    </h3>
                    <p className="text-zinc-300 mt-1">
                      {grantha.language.language_name || "Not specified"}
                    </p>
                  </div>

                  {grantha.author.scribe_name && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400">
                        Scribe
                      </h3>
                      <p className="text-zinc-300 mt-1">
                        {grantha.author.scribe_name}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-zinc-400">
                      Added By
                    </h3>
                    <p className="text-zinc-300 mt-1">
                      {grantha.granthaDeck.user?.user_name || "Unknown"}
                    </p>
                  </div>
                </div>

                {grantha.remarks && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-zinc-400">
                      Remarks
                    </h3>
                    <p className="text-zinc-300 mt-1 whitespace-pre-wrap">
                      {grantha.remarks}
                    </p>
                  </div>
                )}

                {grantha.author.bio && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-zinc-400">
                      Author Bio
                    </h3>
                    <p className="text-zinc-300 mt-1 whitespace-pre-wrap">
                      {grantha.author.bio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {hasImages && (
              <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-200">
                    Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="relative aspect-square overflow-hidden rounded-md mb-3 cursor-pointer group"
                    onClick={() => openModal(activeImageIndex)}
                  >
                    <div
                      className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105"
                      style={{
                        backgroundImage: `url('${getImageUrl(
                          grantha.scannedImages![activeImageIndex].image_url
                        )}')`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {hasImages && grantha.scannedImages!.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {grantha.scannedImages!.map((image, index) => (
                        <div
                          key={image.image_id}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative w-16 h-16 rounded-md overflow-hidden cursor-pointer transition-all ${activeImageIndex === index
                              ? "ring-2 ring-white"
                              : "opacity-70 hover:opacity-100"
                            }`}
                        >
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url('${getImageUrl(
                                image.image_url
                              )}')`,
                              backgroundPosition: "center",
                              backgroundSize: "cover",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-gray-200">
                  Quick Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">
                      Author: {grantha.author.author_name || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">
                      Language:{" "}
                      {grantha.language.language_name || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">
                      Contains:{" "}
                      {grantha.description ? "Description" : "No description"}
                      {grantha.remarks ? ", Notes" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">
                      Images:{" "}
                      {hasImages ? grantha.scannedImages!.length : "None"}
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

      {/* Image Modal */}
      {hasImages && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          images={grantha.scannedImages!}
          initialIndex={activeImageIndex}
        />
      )}

      {/* Delete Grantha Confirmation Modal */}
      <ConfirmationModal
        isOpen={isGranthaDeleteModalOpen}
        onClose={handleGranthaDeleteCancel}
        onConfirm={handleGranthaDeleteConfirm}
        title="Delete Grantha"
        message={`Are you sure you want to delete "${grantha?.grantha_name ||
          `Grantha ${grantha?.grantha_id?.substring(0, 8)}`
          }"? This will permanently delete the grantha and all its associated data. This action cannot be undone.`}
        confirmButtonText="Delete Grantha"
        cancelButtonText="Cancel"
        isLoading={isDeletingGrantha}
        variant="danger"
      />
    </div>
  );
}
