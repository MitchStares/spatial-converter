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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const fileId = uuidv4()
    const fileName = `${fileId}-${req.body.fileName}`

    const [url] = await bucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    })

    res.status(200).json({ uploadUrl: url, fileId, fileName })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error generating signed URL' })
  }
}