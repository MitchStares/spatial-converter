"use client"
 
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, FileUp, Download } from "lucide-react"

const formats = ["GeoJSON", "CSV", "Parquet", "GeoParquet", "Shapefile", "Geodatabase"]
const crsList = ["EPSG:4326", "EPSG:3857", "EPSG:2263", "EPSG:32633"]

export default function SpatialDataConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [inputFormat, setInputFormat] = useState("")
  const [outputFormat, setOutputFormat] = useState("")
  const [inputCRS, setInputCRS] = useState("")
  const [outputCRS, setOutputCRS] = useState("")
  const [simplification, setSimplification] = useState([0])
  const [status, setStatus] = useState("")
  const [downloadUrl, setDownloadUrl] = useState("")
  const [progress, setProgress] = useState(0)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const handleConvert = async () => {
    if (!file || !inputFormat || !outputFormat || !inputCRS || !outputCRS) {
      setStatus("Please select a file, input/output formats, and CRS.")
      return
    }

    setStatus("Generating upload URL...")
    setProgress(0)

    try {
      // Get signed URL
      const urlResponse = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name }),
      })

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, fileId, fileName } = await urlResponse.json()

      // Upload file directly to GCS
      setStatus("Uploading file...")
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Origin': window.location.origin,
        },
        mode: 'cors',  // Add this line
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      setStatus("File uploaded. Starting conversion...")

      // Trigger conversion
      const conversionResponse = await fetch(process.env.NEXT_PUBLIC_CONVERSION_FUNCTION_URL || '', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        mode: 'cors',
        body: JSON.stringify({
          fileId,
          fileName,
          outputFormat,
          inputFormat,
          inputCRS,
          outputCRS,
          simplification: simplification[0],
        }),
      })

      if (!conversionResponse.ok) {
        const errorText = await conversionResponse.text();
        console.error('Conversion failed:', errorText);
        throw new Error(`Conversion failed: ${errorText}`);
      }

      const result = await conversionResponse.json();
      if (result.error) {
        console.error('Conversion error:', result.error, result.traceback);
        throw new Error(result.error);
      }

      setStatus("Conversion complete!");
      setDownloadUrl(result.downloadUrl);
    } catch (error) {
      console.error('Error:', error);
      setStatus(`Error during conversion: ${error.message}`);
    }

    setProgress(100)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Spatial Data Converter</CardTitle>
        <CardDescription>Convert between spatial data formats with CRS transformation and simplification</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <div className="flex items-center space-x-2">
              <Input id="file-upload" type="file" onChange={handleFileChange} />
              <FileUp className="h-6 w-6 text-gray-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Input Format</Label>
              <Select onValueChange={setInputFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select input format" />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format} value={format.toLowerCase()}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select onValueChange={setOutputFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select output format" />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format} value={format.toLowerCase()}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Input CRS</Label>
              <Select onValueChange={setInputCRS}>
                <SelectTrigger>
                  <SelectValue placeholder="Select input CRS" />
                </SelectTrigger>
                <SelectContent>
                  {crsList.map((crs) => (
                    <SelectItem key={crs} value={crs}>{crs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Output CRS</Label>
              <Select onValueChange={setOutputCRS}>
                <SelectTrigger>
                  <SelectValue placeholder="Select output CRS" />
                </SelectTrigger>
                <SelectContent>
                  {crsList.map((crs) => (
                    <SelectItem key={crs} value={crs}>{crs}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Simplification Tolerance</Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={simplification}
              onValueChange={setSimplification}
            />
            <div className="text-sm text-muted-foreground">
              Tolerance: {simplification[0]}%
            </div>
          </div>
          
          <Button onClick={handleConvert} className="w-full">
            Convert
          </Button>
          
          {status && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{status}</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          
          {downloadUrl && (
            <Button asChild className="w-full">
              <a href={downloadUrl} download>
                <Download className="mr-2 h-4 w-4" /> Download Converted File
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}