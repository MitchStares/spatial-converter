import { NextApiRequest, NextApiResponse } from 'next'
import { Storage } from '@google-cloud/storage'
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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Manually parse the request body
  let body = ''
  req.on('data', chunk => {
    body += chunk.toString()
  })

  req.on('end', async () => {
    try {
      const { fileName } = JSON.parse(body)
      console.log('Request body:', { fileName }); // Log the parsed body

      const fileId = uuidv4()
      const fullFileName = `${fileId}-${fileName}`

      console.log('Generating signed URL for:', fullFileName); // Log the file name

      const [url] = await bucket.file(fullFileName).getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      })

      console.log('Signed URL generated successfully'); // Log success

      res.status(200).json({ uploadUrl: url, fileId, fileName: fullFileName })
    } catch (error) {
      console.error('Error:', error)
      res.status(500).json({ error: 'Error generating signed URL', details: error.message })
    }
  })
}