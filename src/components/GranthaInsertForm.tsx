"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { useForm } from "react-hook-form";
import { nanoid } from 'nanoid';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Save, ChevronDown } from "lucide-react";

// Types based on Prisma schema
type Language = {
  language_id: string;
  language_name: string;
};

type Author = {
  author_id: string;
  author_name: string;
};

type GranthaDeckProps = {
  deckId?: string;
  onSuccess?: () => void;
};

export default function GranthaInsertForm({ deckId, onSuccess }: GranthaDeckProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  // Initialize form
  const form = useForm({
    defaultValues: {
      grantha_name: "",
      description: "",
      remarks: "",
    },
  });

  // Fetch languages and authors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [languagesRes, authorsRes] = await Promise.all([
          axios.get('/api/languages'),
          axios.get('/api/authors')
        ]);
        setLanguages(languagesRes.data);
        setAuthors(authorsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    };
    
    fetchData();
  }, []);

  const onSubmit = async (data: any) => {
    if (!selectedLanguage) {
      toast.error("Please select a language");
      return;
    }

    if (!selectedAuthor) {
      toast.error("Please select an author");
      return;
    }

    if (!deckId) {
      toast.error("No deck ID provided");
      return;
    }

    setIsSubmitting(true);

    try {
      const granthaData = {
        grantha_id: nanoid(), // Generate a unique ID
        grantha_deck_id: deckId,
        grantha_name: data.grantha_name,
        language_id: selectedLanguage.language_id,
        author_id: selectedAuthor.author_id,
        description: data.description,
        remarks: data.remarks,
      };

      const response = await axios.post('/api/grantha', granthaData);
      
      toast.success("Grantha added successfully");
      form.reset();
      setSelectedLanguage(null);
      setSelectedAuthor(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to add Grantha");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">Add New Grantha</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Grantha Name */}
              <FormField
                control={form.control}
                name="grantha_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Grantha Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-zinc-800 border-zinc-700 text-zinc-100" 
                        placeholder="Enter grantha name" 
                        required
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* Language Dropdown */}
              <FormItem>
                <FormLabel className="text-zinc-300">Language</FormLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between bg-zinc-800 border-zinc-700 text-zinc-100"
                    >
                      {selectedLanguage ? selectedLanguage.language_name : "Select language"}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full bg-zinc-800 border-zinc-700">
                    {languages.length > 0 ? (
                      languages.map((language) => (
                        <DropdownMenuItem
                          key={language.language_id}
                          onClick={() => setSelectedLanguage(language)}
                          className="text-zinc-100 cursor-pointer hover:bg-zinc-700"
                        >
                          {language.language_name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled className="text-zinc-500">
                        No languages available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                {!selectedLanguage && form.formState.isSubmitted && (
                  <p className="text-sm font-medium text-red-400 mt-1">
                    Language is required
                  </p>
                )}
              </FormItem>

              {/* Author Dropdown */}
              <FormItem>
                <FormLabel className="text-zinc-300">Author</FormLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between bg-zinc-800 border-zinc-700 text-zinc-100"
                    >
                      {selectedAuthor ? selectedAuthor.author_name : "Select author"}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full bg-zinc-800 border-zinc-700">
                    {authors.length > 0 ? (
                      authors.map((author) => (
                        <DropdownMenuItem
                          key={author.author_id}
                          onClick={() => setSelectedAuthor(author)}
                          className="text-zinc-100 cursor-pointer hover:bg-zinc-700"
                        >
                          {author.author_name}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled className="text-zinc-500">
                        No authors available
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                {!selectedAuthor && form.formState.isSubmitted && (
                  <p className="text-sm font-medium text-red-400 mt-1">
                    Author is required
                  </p>
                )}
              </FormItem>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[100px]" 
                        placeholder="Enter description" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* Remarks */}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 min-h-[100px]" 
                        placeholder="Enter remarks" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Grantha
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 