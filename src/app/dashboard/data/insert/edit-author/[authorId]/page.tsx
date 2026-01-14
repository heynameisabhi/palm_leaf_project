"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, BookOpen, Calendar, User, Feather } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function EditAuthorPage() {
  const router = useRouter();
  const params = useParams();
  const authorId = params.authorId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formData, setFormData] = useState({
    author_name: "",
    birth_year: "",
    death_year: "",
    bio: "",
    scribe_name: "",
  });

  // Fetch author data on component mount
  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const response = await axios.get(`/api/grantha-authors/${authorId}`);
        const author = response.data;
        
        setFormData({
          author_name: author.author_name || "",
          birth_year: author.birth_year || "",
          death_year: author.death_year || "",
          bio: author.bio || "",
          scribe_name: author.scribe_name || "",
        });
      } catch (error: any) {
        toast.error(error.response?.data || "Failed to fetch author details");
        router.back();
      } finally {
        setIsFetching(false);
      }
    };

    if (authorId) {
      fetchAuthor();
    }
  }, [authorId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.put(`/api/grantha-authors/${authorId}`, formData);

      toast.success(`Author ${formData.author_name} updated successfully.`);
      router.back();
    } catch (error: any) {
      toast.error(error.response?.data || "Failed to update author");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <p className="text-gray-400">Loading author details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black p-4">
      <div className="relative z-10 w-full max-w-2xl">
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-green-500/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-green-500/10 blur-3xl"></div>

        <Card className="overflow-hidden border-0 bg-black/40 backdrop-blur-xl backdrop-filter">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-70"></div>

          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                <BookOpen className="h-4 w-4 text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">Edit Author</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Update the details of the author in your collection.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pb-6">
              <div className="group relative space-y-2 transition-all duration-300">
                <Label htmlFor="author_name" className="flex items-center text-sm font-medium text-gray-300">
                  <User className="mr-2 h-3.5 w-3.5 text-green-400" />
                  Author Name
                </Label>
                <div className="relative">
                  <Input
                    id="author_name"
                    name="author_name"
                    value={formData.author_name}
                    onChange={handleChange}
                    placeholder="author name"
                    className="border-0 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:ring-1 focus:ring-green-500/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="group relative space-y-2 transition-all duration-300">
                  <Label htmlFor="birth_year" className="flex items-center text-sm font-medium text-gray-300">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-green-400" />
                    Birth Year
                  </Label>
                  <div className="relative">
                    <Input
                      id="birth_year"
                      name="birth_year"
                      value={formData.birth_year}
                      onChange={handleChange}
                      placeholder="enter birth year"
                      className="border-0 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:ring-1 focus:ring-green-500/50"
                    />
                  </div>
                </div>

                <div className="group relative space-y-2 transition-all duration-300">
                  <Label htmlFor="death_year" className="flex items-center text-sm font-medium text-gray-300">
                    <Calendar className="mr-2 h-3.5 w-3.5 text-green-400" />
                    Death Year
                  </Label>
                  <div className="relative">
                    <Input
                      id="death_year"
                      name="death_year"
                      value={formData.death_year}
                      onChange={handleChange}
                      placeholder="enter death year"
                      className="border-0 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:ring-1 focus:ring-green-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="group relative space-y-2 transition-all duration-300">
                <Label htmlFor="bio" className="flex items-center text-sm font-medium text-gray-300">
                  <BookOpen className="mr-2 h-3.5 w-3.5 text-green-400" />
                  Biography
                </Label>
                <div className="relative">
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Enter author's biography..."
                    className="min-h-[120px] border-0 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:ring-1 focus:ring-green-500/50"
                  />
                </div>
              </div>

              <div className="group relative space-y-2 transition-all duration-300">
                <Label htmlFor="scribe_name" className="flex items-center text-sm font-medium text-gray-300">
                  <Feather className="mr-2 h-3.5 w-3.5 text-green-400" />
                  Scribe Name
                </Label>
                <div className="relative">
                  <Input
                    id="scribe_name"
                    name="scribe_name"
                    value={formData.scribe_name}
                    onChange={handleChange}
                    placeholder="Contributor's name"
                    className="border-0 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:ring-1 focus:ring-green-500/50"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-white/5 bg-white/5 px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="text-gray-400 cursor-pointer hover:bg-white/5 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="relative cursor-pointer overflow-hidden bg-gradient-to-r from-emerald-900 to-green-600 hover:from-emerald-900 hover:to-green-800 text-white transition-all duration-300"
              >
                <span className="relative z-10">
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Author...
                    </span>
                  ) : (
                    "Update Author"
                  )}
                </span>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}