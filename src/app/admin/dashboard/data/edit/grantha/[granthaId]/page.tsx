"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import { Prisma } from "@prisma/client";

type GranthaWithDetails = Prisma.GranthaGetPayload<{
  include: {
    granthaDeck: {
      select: {
        grantha_deck_id: true;
        grantha_deck_name: true;
        user: {
          select: { user_name: true };
        };
      };
    };
    language: true;
    author: true;
  };
}>;

export default function EditGranthaPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const granthaId = params.granthaId as string;

  // Form state
  const [formData, setFormData] = useState({
    grantha_name: "",
    description: "",
    remarks: "",
    author_name: "",
    birth_year: "",
    death_year: "",
    bio: "",
    scribe_name: "",
    language_name: "",
  });

  // Fetch grantha data
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["grantha-detail", granthaId],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/grantha/${granthaId}`);
      return response.data;
    },
  });

  // Update form data when grantha data is loaded
  useEffect(() => {
    if (data?.grantha) {
      const grantha = data.grantha;
      setFormData({
        grantha_name: grantha.grantha_name || "",
        description: grantha.description || "",
        remarks: grantha.remarks || "",
        author_name: grantha.author.author_name || "",
        birth_year: grantha.author.birth_year || "",
        death_year: grantha.author.death_year || "",
        bio: grantha.author.bio || "",
        scribe_name: grantha.author.scribe_name || "",
        language_name: grantha.language.language_name || "",
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData: typeof formData) => {
      const response = await axios.put(`/api/admin/grantha/${granthaId}`, updatedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grantha-detail", granthaId] });
      toast.success("Grantha updated successfully");
      router.push(`/admin/dashboard/data/view/grantha/${granthaId}`);
    },
    onError: (error) => {
      toast.error("Failed to update Grantha");
      console.error("Update error:", error);
    },
  });

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-64 bg-zinc-800" />
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 bg-zinc-800" />
              <Skeleton className="h-4 w-1/2 bg-zinc-800" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-zinc-800" />
                    <Skeleton className="h-10 w-full bg-zinc-800" />
                  </div>
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
            {error instanceof Error ? error.message : "Failed to load Grantha details"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const grantha: GranthaWithDetails = data.grantha;

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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-100">Edit Grantha</h1>
            <p className="text-muted-foreground mt-1">
              Editing: {grantha.grantha_name || "Untitled Grantha"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-gray-200">Grantha Details</CardTitle>
              <CardDescription className="text-zinc-400">
                Update the information for this Grantha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="grantha_name" className="text-zinc-300">
                    Grantha Name
                  </Label>
                  <Input
                    id="grantha_name"
                    name="grantha_name"
                    value={formData.grantha_name}
                    onChange={handleInputChange}
                    className="bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language_name" className="text-zinc-300">
                    Language
                  </Label>
                  <Input
                    id="language_name"
                    name="language_name"
                    value={formData.language_name}
                    onChange={handleInputChange}
                    className="bg-zinc-900 border-zinc-800 text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-zinc-300">
                  Remarks
                </Label>
                <Textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 min-h-[100px]"
                />
              </div>

              <div className="border-t border-zinc-800 pt-6">
                <h3 className="text-lg font-medium text-zinc-200 mb-4">Author Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="author_name" className="text-zinc-300">
                      Author Name
                    </Label>
                    <Input
                      id="author_name"
                      name="author_name"
                      value={formData.author_name}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scribe_name" className="text-zinc-300">
                      Scribe Name
                    </Label>
                    <Input
                      id="scribe_name"
                      name="scribe_name"
                      value={formData.scribe_name}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_year" className="text-zinc-300">
                      Birth Year
                    </Label>
                    <Input
                      id="birth_year"
                      name="birth_year"
                      value={formData.birth_year}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="death_year" className="text-zinc-300">
                      Death Year
                    </Label>
                    <Input
                      id="death_year"
                      name="death_year"
                      value={formData.death_year}
                      onChange={handleInputChange}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor="bio" className="text-zinc-300">
                    Biography
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="bg-zinc-900 border-zinc-800 text-zinc-100 min-h-[150px]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-white hover:bg-gray-200 text-black cursor-pointer"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
} 