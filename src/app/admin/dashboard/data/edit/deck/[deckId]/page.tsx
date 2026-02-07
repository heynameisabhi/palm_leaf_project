"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function EditGranthaDeck() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.deckId as string;

  const [formData, setFormData] = useState({
    grantha_deck_name: "",
    grantha_owner_name: "",
    grantha_source_address: "",
    length_in_cms: "",
    width_in_cms: "",
    total_leaves: "",
    total_images: "",
    stitch_or_nonstitch: "",
    physical_condition: "",
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["grantha-deck-detail", deckId],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/grantha-deck/${deckId}`);
      return response.data;
    },
  });

  // Use useEffect to update form data when data is loaded
  useEffect(() => {
    if (data?.granthaDeck) {
      const deck = data.granthaDeck;
      setFormData({
        grantha_deck_name: deck.grantha_deck_name || "",
        grantha_owner_name: deck.grantha_owner_name || "",
        grantha_source_address: deck.grantha_source_address || "",
        length_in_cms: deck.length_in_cms?.toString() || "",
        width_in_cms: deck.width_in_cms?.toString() || "",
        total_leaves: deck.total_leaves?.toString() || "",
        total_images: deck.total_images?.toString() || "",
        stitch_or_nonstitch: deck.stitch_or_nonstitch || "",
        physical_condition: deck.physical_condition || "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await axios.put(`/api/admin/grantha-deck/${deckId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Grantha Deck updated successfully");
      router.push(`/admin/dashboard/data/view/${deckId}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to update Grantha Deck';
      toast.error(message || "Failed to update Grantha Deck");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-64 bg-zinc-800" />
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 bg-zinc-800" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full bg-zinc-800" />
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
            {error instanceof Error ? error.message : "Failed to load Grantha Deck"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const deck = data?.granthaDeck;

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
          <h1 className="text-3xl font-bold text-gray-100">Edit Grantha Deck</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-gray-200">Deck Information</CardTitle>
              <CardDescription className="text-zinc-400">
                Update the information for this Grantha Deck
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="grantha_deck_name" className="text-zinc-400">
                      Deck Name
                      {deck?.grantha_deck_name && (
                        <span className="text-zinc-500 ml-2">
                          (Current: {deck.grantha_deck_name})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="grantha_deck_name"
                      name="grantha_deck_name"
                      value={formData.grantha_deck_name}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      placeholder={deck?.grantha_deck_name || "Enter deck name"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grantha_owner_name" className="text-zinc-400">
                      Owner Name
                      {deck?.grantha_owner_name && (
                        <span className="text-zinc-500 ml-2">
                          (Current: {deck.grantha_owner_name})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="grantha_owner_name"
                      name="grantha_owner_name"
                      value={formData.grantha_owner_name}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      placeholder={deck?.grantha_owner_name || "Enter owner name"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grantha_source_address" className="text-zinc-400">
                      Source Address
                      {deck?.grantha_source_address && (
                        <span className="text-zinc-500 ml-2">
                          (Current: {deck.grantha_source_address})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="grantha_source_address"
                      name="grantha_source_address"
                      value={formData.grantha_source_address}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      placeholder={deck?.grantha_source_address || "Enter source address"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="physical_condition" className="text-zinc-400">
                      Physical Condition
                      {deck?.physical_condition && (
                        <span className="text-zinc-500 ml-2">
                          (Current: {deck.physical_condition})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="physical_condition"
                      name="physical_condition"
                      value={formData.physical_condition}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      placeholder={deck?.physical_condition || "Enter physical condition"}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="length_in_cms" className="text-zinc-400">
                      Length (cm)
                      {deck?.length_in_cms && (
                        <span className="text-zinc-500 ml-2">
                          (Current: {deck.length_in_cms})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="length_in_cms"
                      name="length_in_cms"
                      type="number"
                      step="0.01"
                      value={formData.length_in_cms}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      placeholder={deck?.length_in_cms?.toString() || "Enter length"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width_in_cms" className="text-zinc-400">
                      Width (cm)
                      {deck?.width_in_cms && (
                        <span className="text-zinc-500 ml-2">
                          (Current: {deck.width_in_cms})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="width_in_cms"
                      name="width_in_cms"
                      type="number"
                      step="0.01"
                      value={formData.width_in_cms}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      placeholder={deck?.width_in_cms?.toString() || "Enter width"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_leaves" className="text-zinc-400">
                      Total Leaves
                      {deck?.total_leaves && (
                        <span className="text-zinc-500 ml-2">
                          (Current: {deck.total_leaves})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="total_leaves"
                      name="total_leaves"
                      type="number"
                      value={formData.total_leaves}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      placeholder={deck?.total_leaves?.toString() || "Enter total leaves"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stitch_or_nonstitch" className="text-zinc-400">
                      Stitch or Non Stitch
                      {deck?.stitch_or_nonstitch && (
                        <span className="text-zinc-500 ml-2">
                          (Current: {deck.stitch_or_nonstitch})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="stitch_or_nonstitch"
                      name="stitch_or_nonstitch"
                      value={formData.stitch_or_nonstitch}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      placeholder={deck?.stitch_or_nonstitch || "Enter stitch type"}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-zinc-800 hover:text-black text-white hover:bg-zinc-300 bg-zinc-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
} 