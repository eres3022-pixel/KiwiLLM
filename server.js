import cors from 'cors'
import express from 'express'
import { port, allowedOrigins } from './server/config.js'
import { router } from './server/routes.js'

const app = express()

app.disable('x-powered-by')
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (req.secure || req.get('x-forwarded-proto') === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})
const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('CORS origin not allowed'))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'x-api-key', 'anthropic-version'],
  maxAge: 86400,
})
app.use(['/api', '/v1'], corsMiddleware)
app.use(express.json({ limit: '1mb' }))

import { join } from 'node:path'
import { existsSync } from 'node:fs'

const distPath = join(process.cwd(), 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
}

app.use(router)

app.use((error, _req, res, next) => {
  if (error?.message === 'CORS origin not allowed') {
    return res.status(403).json({ error: 'CORS origin not allowed.' })
  }
  return next(error)
})

app.use((req, res) => {
  if (existsSync(distPath) && !req.path.startsWith('/api') && !req.path.startsWith('/v1')) {
    return res.sendFile(join(distPath, 'index.html'))
  }
  res.status(200).json({ status: 'Kiwi LLM API is running', message: 'Ready to receive requests.' })
})

app.listen(port, () => {
  console.log(`Kiwi LLM server running on port ${port}`)
})
