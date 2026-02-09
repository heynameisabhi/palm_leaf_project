"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import { toast } from "sonner"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, BookOpen, Calendar, User, Feather } from "lucide-react"

export default function EditAuthorPage() {

  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const [formData, setFormData] = useState({
    author_name: "",
    birth_year: "",
    death_year: "",
    bio: "",
    scribe_name: "",
  })

  // ======================
  // ✅ Fetch Author Data
  // ======================
  useEffect(() => {

    const fetchAuthor = async () => {
      try {

        const res = await axios.get(`/api/authors/${id}`)
        setFormData(res.data)

      } catch (error) {

        toast.error("Failed to load author")

      } finally {
        setIsFetching(false)
      }
    }

    if (id) fetchAuthor()

  }, [id])



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }



  // ======================
  // ✅ Update Author
  // ======================
  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    setIsSubmitting(true)

    try {

      await axios.put(`/api/authors/${id}`, formData)

      toast.success("Author updated successfully")

      router.push("/dashboard/data/insert/author") // change if your list page path differs

    } catch (error) {

      toast.error("Failed to update author")

    } finally {
      setIsSubmitting(false)
    }
  }



  // ======================
  // Loading UI
  // ======================
  if (isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Loading Author...
      </div>
    )
  }


return (
  <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black p-4">

    <div className="relative z-10 w-full max-w-2xl">
      {/* Ambient glow */}
      <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />

      <Card className="relative overflow-hidden border-0 bg-black/40 backdrop-blur-xl">
        {/* top accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-70" />

        {/* HEADER */}
        <CardHeader className="space-y-1 pb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
              <BookOpen className="h-4 w-4 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Edit Author
            </CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            Update the historical and manuscript attribution details.
          </CardDescription>
        </CardHeader>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pb-6">

            {/* Author Name */}
            <div className="space-y-2">
              <Label className="flex items-center text-sm font-medium text-gray-300">
                <User className="mr-2 h-3.5 w-3.5 text-green-400" />
                Author Name
              </Label>
              <Input
                name="author_name"
                value={formData.author_name}
                onChange={handleChange}
                required
                className="border-0 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-green-500/50"
              />
            </div>

            {/* Years */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium text-gray-300">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-green-400" />
                  Birth Year
                </Label>
                <Input
                  name="birth_year"
                  value={formData.birth_year}
                  onChange={handleChange}
                  className="border-0 bg-white/5 px-4 py-3 text-white focus:ring-1 focus:ring-green-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium text-gray-300">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-green-400" />
                  Death Year
                </Label>
                <Input
                  name="death_year"
                  value={formData.death_year}
                  onChange={handleChange}
                  className="border-0 bg-white/5 px-4 py-3 text-white focus:ring-1 focus:ring-green-500/50"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="flex items-center text-sm font-medium text-gray-300">
                <BookOpen className="mr-2 h-3.5 w-3.5 text-green-400" />
                Biography
              </Label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="min-h-[120px] border-0 bg-white/5 px-4 py-3 text-white focus:ring-1 focus:ring-green-500/50"
              />
            </div>

            {/* Scribe */}
            <div className="space-y-2">
              <Label className="flex items-center text-sm font-medium text-gray-300">
                <Feather className="mr-2 h-3.5 w-3.5 text-green-400" />
                Scribe Name
              </Label>
              <Input
                name="scribe_name"
                value={formData.scribe_name}
                onChange={handleChange}
                className="border-0 bg-white/5 px-4 py-3 text-white focus:ring-1 focus:ring-green-500/50"
              />
            </div>

          </CardContent>

          {/* FOOTER */}
          <CardFooter className="flex justify-between border-t border-white/5 bg-white/5 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-900 to-green-600 hover:to-green-700 text-white"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  </div>
);

}
