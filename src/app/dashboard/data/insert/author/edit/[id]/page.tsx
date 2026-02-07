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
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] p-4">

      <div className="w-full max-w-2xl">

        <Card className="bg-black/40 backdrop-blur-xl">

          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Edit Author
            </CardTitle>

            <CardDescription>
              Update author details
            </CardDescription>
          </CardHeader>


          <form onSubmit={handleSubmit}>

            <CardContent className="space-y-6">

              {/* Author Name */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  <User className="inline mr-2 h-4 w-4" />
                  Author Name
                </Label>

                <Input
                  name="author_name"
                  value={formData.author_name ?? ""}
                  onChange={handleChange}
                  required
                />
              </div>


              {/* Birth + Death */}
              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label className="text-gray-300">
                    <Calendar className="inline mr-2 h-4 w-4" />
                    Birth Year
                  </Label>

                  <Input
                    name="birth_year"
                    value={formData.birth_year ?? ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">
                    <Calendar className="inline mr-2 h-4 w-4" />
                    Death Year
                  </Label>

                  <Input
                    name="death_year"
                    value={formData.death_year ?? ""}
                    onChange={handleChange}
                  />
                </div>

              </div>


              {/* Biography */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  <BookOpen className="inline mr-2 h-4 w-4" />
                  Biography
                </Label>

                <Textarea
                  name="bio"
                  value={formData.bio ?? ""}
                  onChange={handleChange}
                />
              </div>


              {/* Scribe */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  <Feather className="inline mr-2 h-4 w-4" />
                  Scribe Name
                </Label>

                <Input
                  name="scribe_name"
                  value={formData.scribe_name ?? ""}
                  onChange={handleChange}
                />
              </div>

            </CardContent>



            <CardFooter className="flex justify-between">

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Cancel
              </Button>


              <Button type="submit" disabled={isSubmitting}>

                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update Author"
                )}

              </Button>

            </CardFooter>

          </form>

        </Card>

      </div>

    </div>
  )
}
