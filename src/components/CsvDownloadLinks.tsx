"use client"

import { useState } from "react"
import { Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

const CsvDownloadLinks = () => {
  const [csvFiles, setCsvFiles] = useState([
    {
      name: "GranthaDeck.csv",
      description: "Grantha deck data and metadata",
      size: "2.4 MB",
    },
    {
      name: "Grantha.csv",
      description: "Complete Grantha collection information",
      size: "3.7 MB",
    },
    {
      name: "ScannedImageAndProperties.csv",
      description: "Scanned images with associated properties",
      size: "5.1 MB",
    },
  ])

  return (
    <div className="py-8 px-4">
      <h3 className="text-xl font-semibold text-white mb-6">Download CSV Files</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {csvFiles.map((file, index) => (
          <Card
            key={index}
            className="bg-[#121212] border-[#2a2a2a] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="h-2 bg-gradient-to-r from-green-950 to-green-600"></div>
            <CardContent className="pt-6 pb-4">
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-800/50 rounded-lg mr-4">
                  <FileText className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white text-lg mb-1">{file.name}</h4>
                  <p className="text-gray-400 text-sm">{file.description}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <Badge variant="outline" className="text-gray-300 border-[#2a2a2a] px-4 py-1 bg-[#080808]">
                  {file.size}
                </Badge>
                <Badge variant="outline" className="text-gray-300 border-[#2a2a2a] px-4 py-1 bg-[#080808]">
                  CSV
                </Badge>
              </div>
            </CardContent>

            <CardFooter className="bg-[#0c0c0c] pt-3 pb-3">
              <a href={`/csv/${file.name}`} download className="w-full">
                <Button variant="ghost" className="w-full text-white hover:bg-[#171717] cursor-pointer hover:text-green-400">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default CsvDownloadLinks

