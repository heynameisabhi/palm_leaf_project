"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import axios from "axios"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Skeleton } from "@/components/ui/Skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert"
import { AlertCircle, ArrowLeft, Save } from "lucide-react"
import { formatTimeAgo } from "@/helpers/formatTime"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"

type Author = {
  author_id: string
  author_name: string
  birth_year: number | null
  death_year: number | null
  scribe_name: string | null
  bio: string | null
}

type Language = {
  language_id: string
  language_name: string
}

type Grantha = {
  grantha_id: string
  grantha_name: string
  description: string | null
  remarks: string | null
  author_id: string
  language_id: string
  grantha_deck_id: string
  author: Author
  language: Language
  updatedAt: string
}

export default function EditGranthaPage({ params }: { params: { id: string } }) {
  const granthaId = params.id

  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Grantha>>({})
  const [authors, setAuthors] = useState<Author[]>([])
  const [languages, setLanguages] = useState<Language[]>([])

  // Fetch grantha data
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["grantha", granthaId],
    queryFn: async () => {
      try {
        const response = await axios.get(`/api/user/view-grantha/${granthaId}`)
        if (!response.data.grantha) {
          throw new Error("Grantha not found")
        }
        return response.data
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          throw new Error("Grantha not found")
        }
        throw error
      }
    },
    enabled: !!granthaId,
  })

  // Fetch authors and languages for dropdowns
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [authorsRes, languagesRes] = await Promise.all([axios.get("/api/authors"), axios.get("/api/languages")])
        setAuthors(authorsRes.data.authors || [])
        setLanguages(languagesRes.data.languages || [])
      } catch (error) {
        console.error("Failed to fetch options:", error)
      }
    }
    fetchOptions()
  }, [])

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<Grantha>) => {
      const response = await axios.put(`/api/user/edit-grantha/${granthaId}`, updatedData)
      return response.data
    },
    onSuccess: () => {
      router.push(`/dashboard/data/view/view-grantha/${granthaId}`)
    },
  })

  useEffect(() => {
    if (data?.grantha) {
      setFormData({
        grantha_name: data.grantha.grantha_name,
        description: data.grantha.description,
        remarks: data.grantha.remarks,
        author_id: data.grantha.author_id,
        language_id: data.grantha.language_id,
      })
    }
  }, [data?.grantha])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAuthorChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      author_id: value,
    }))
  }

  const handleLanguageChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      language_id: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24 bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="bg-zinc-900 border-red-900 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error instanceof Error ? error.message : "Failed to load data"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const grantha = data?.grantha

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
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
            <h1 className="text-2xl font-bold text-gray-200">Edit Grantha</h1>
            <p className="text-muted-foreground text-sm">
              {grantha?.grantha_name || `Grantha ${grantha?.grantha_id?.substring(0, 8)}`} • Last updated{" "}
              {grantha?.updatedAt ? formatTimeAgo(new Date(grantha.updatedAt)) : "N/A"}
            </p>
          </div>
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-200">Grantha Information</CardTitle>
            <CardDescription className="text-sm text-zinc-400">
              Update the details of your Grantha. IDs cannot be modified.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Read-only ID field */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-zinc-400">Grantha ID (Read-only)</label>
                  <Input
                    value={grantha?.grantha_id || ""}
                    disabled
                    className="bg-zinc-800 border-zinc-600 text-zinc-500 h-8 text-sm cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="grantha_name" className="text-xs font-medium text-zinc-300">
                    Grantha Name *
                  </label>
                  <Input
                    id="grantha_name"
                    name="grantha_name"
                    value={formData.grantha_name || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm"
                    placeholder="Enter grantha name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="author_id" className="text-xs font-medium text-zinc-300">
                    Author *
                  </label>
                  <Select value={formData.author_id || ""} onValueChange={handleAuthorChange}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                      <SelectValue placeholder="Select author" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                      {authors.map((author) => (
                        <SelectItem
                          key={author.author_id}
                          value={author.author_id}
                          className="hover:bg-zinc-800 text-sm"
                        >
                          {author.author_name}
                          {author.birth_year && author.death_year && (
                            <span className="text-xs text-zinc-500 ml-2">
                              ({author.birth_year} - {author.death_year})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="language_id" className="text-xs font-medium text-zinc-300">
                    Language *
                  </label>
                  <Select value={formData.language_id || ""} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                      {languages.map((language) => (
                        <SelectItem
                          key={language.language_id}
                          value={language.language_id}
                          className="hover:bg-zinc-800 text-sm"
                        >
                          {language.language_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="description" className="text-xs font-medium text-zinc-300">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 text-sm min-h-[100px]"
                    placeholder="Enter grantha description"
                    rows={4}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="remarks" className="text-xs font-medium text-zinc-300">
                    Remarks
                  </label>
                  <Textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks || ""}
                    onChange={handleChange}
                    className="bg-zinc-900 border-zinc-700 text-zinc-300 text-sm min-h-[80px]"
                    placeholder="Enter any additional remarks"
                    rows={3}
                  />
                </div>

                {/* Read-only deck ID field */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-zinc-400">Grantha Deck ID (Read-only)</label>
                  <Input
                    value={grantha?.grantha_deck_id || ""}
                    disabled
                    className="bg-zinc-800 border-zinc-600 text-zinc-500 h-8 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-zinc-300 hover:bg-zinc-800 h-8"
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

        {/* Current Values Reference Card */}
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-gray-200">Current Values</CardTitle>
            <CardDescription className="text-sm text-zinc-400">
              Reference for the current values in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-400">Current Author</h3>
                <p className="text-zinc-300 mt-1">
                  {grantha?.author?.author_name || "Not specified"}
                  {grantha?.author?.birth_year && grantha?.author?.death_year && (
                    <span className="text-xs text-zinc-500 ml-2">
                      ({grantha.author.birth_year} - {grantha.author.death_year})
                    </span>
                  )}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-400">Current Language</h3>
                <p className="text-zinc-300 mt-1">{grantha?.language?.language_name || "Not specified"}</p>
              </div>

              {grantha?.description && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-zinc-400">Current Description</h3>
                  <p className="text-zinc-300 mt-1 text-sm whitespace-pre-wrap">{grantha.description}</p>
                </div>
              )}

              {grantha?.remarks && (
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-zinc-400">Current Remarks</h3>
                  <p className="text-zinc-300 mt-1 text-sm whitespace-pre-wrap">{grantha.remarks}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
