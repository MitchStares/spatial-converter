import { NextApiRequest, NextApiResponse } from 'next'
import { Storage } from '@google-cloud/storage'
import formidable from 'formidable'
import { v4 as uuidv4 } from 'uuid'

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
}

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_CREDENTIALS || '{}'),
})

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME || '')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = new formidable.IncomingForm()

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing form data' })
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileId = uuidv4()
    const fileName = `${fileId}-${file.originalFilename}`

    try {
      await bucket.upload(file.filepath, {
        destination: fileName,
        metadata: {
          contentType: file.mimetype || 'application/octet-stream',
        },
      })

      // Trigger Cloud Run function for conversion
      const conversionResponse = await fetch(process.env.CONVERSION_FUNCTION_URL || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          fileName,
          outputFormat: fields.outputFormat,
        }),
      })

      if (!conversionResponse.ok) {
        throw new Error('Conversion failed')
      }

      const conversionResult = await conversionResponse.json()

      res.status(200).json({
        message: 'File uploaded and conversion started',
        fileId,
        conversionStatus: conversionResult.status,
      })
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Error processing file' })
    }
  })
}