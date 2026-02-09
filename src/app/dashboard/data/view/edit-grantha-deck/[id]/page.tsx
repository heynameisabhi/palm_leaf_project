"use client";

import { useState, useEffect } from "react";
import {  useParams,useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { formatTimeAgo } from "@/helpers/formatTime";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

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
};

const STITCH_TYPES = [
  { value: "stitch", label: "Stitch" },
  { value: "non stitch", label: "Non Stitch" },
];

export default function EditGranthaDeckPage() {
  const params = useParams<{ id: string }>();
  const deckId = params.id?.toString();

  const router = useRouter();
  const [formData, setFormData] = useState<Partial<GranthaDeck>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["grantha-deck", deckId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/user/view-records/${deckId}`);
        if (!response.data.granthaDeck) {
          throw new Error("Deck not found");
        }
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          throw new Error("Deck not found");
        }
        throw error;
      }
    },
    enabled: !!deckId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<GranthaDeck>) => {
      const response = await axios.put(`/api/user/edit-records/${deckId}`, updatedData);
      return response.data;
    },
    onSuccess: () => {
      router.push("/dashboard/data/view");
    },
  });

  useEffect(() => {
    if (data?.granthaDeck) {
      setFormData(data.granthaDeck);
    }
  }, [data?.granthaDeck]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStitchTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      stitch_or_nonstitch: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24 bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
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

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="space-y-4">
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
            <h1 className="text-2xl font-bold text-gray-200">Edit Grantha Deck</h1>
            <p className="text-muted-foreground text-sm">
              Last updated {data?.granthaDeck?.updatedAt ? formatTimeAgo(new Date(data.granthaDeck.updatedAt)) : 'N/A'}
            </p>
          </div>
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-200">Deck Information</CardTitle>
            <CardDescription className="text-sm text-zinc-400">
              Update the details of your Grantha Deck
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="grantha_deck_name"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Deck Name
                  </label>
                  <Input
                    id="grantha_deck_name"
                    name="grantha_deck_name"
                    value={formData.grantha_deck_name || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter deck name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="grantha_owner_name"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Owner Name
                  </label>
                  <Input
                    id="grantha_owner_name"
                    name="grantha_owner_name"
                    value={formData.grantha_owner_name || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter owner name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="grantha_source_address"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Source Address
                  </label>
                  <Input
                    id="grantha_source_address"
                    name="grantha_source_address"
                    value={formData.grantha_source_address || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter source address"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="length_in_cms"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Length (cm)
                  </label>
                  <Input
                    id="length_in_cms"
                    name="length_in_cms"
                    type="number"
                    step="0.1"
                    value={formData.length_in_cms || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter length in centimeters"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="width_in_cms"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Width (cm)
                  </label>
                  <Input
                    id="width_in_cms"
                    name="width_in_cms"
                    type="number"
                    step="0.1"
                    value={formData.width_in_cms || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter width in centimeters"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="total_leaves"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Total Leaves
                  </label>
                  <Input
                    id="total_leaves"
                    name="total_leaves"
                    type="number"
                    value={formData.total_leaves || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter total number of leaves"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="total_images"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Total Images
                  </label>
                  <Input
                    id="total_images"
                    name="total_images"
                    type="number"
                    value={formData.total_images || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter total number of images"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="stitch_or_nonstitch"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Stitch Type
                  </label>
                  <Select
                    value={formData.stitch_or_nonstitch || ""}
                    onValueChange={handleStitchTypeChange}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                      <SelectValue placeholder="Select stitch type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                      {STITCH_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="hover:bg-zinc-800 text-sm"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="physical_condition"
                    className="text-xs font-medium text-zinc-300"
                  >
                    Physical Condition
                  </label>
                  <Input
                    id="physical_condition"
                    name="physical_condition"
                    value={formData.physical_condition || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter physical condition"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-zinc-300  hover:bg-zinc-800 h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-white hover:bg-zinc-200 text-black h-8"
                disabled={updateMutation.isPending}
              >
                <Save className="h-3 w-3 mr-1" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}