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
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin) {
    if (origin.endsWith('kiwillm.in') || origin.endsWith('vercel.app') || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-api-key, anthropic-version')
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})
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
  if (existsSync(distPath) && !req.path.startsWith('/api') && !req.path.startsWith('/v1') && req.path !== '/health') {
    if (req.path === '/invite' || req.path === '/invite.html') {
      const inviteHtml = join(distPath, 'invite.html')
      if (existsSync(inviteHtml)) return res.sendFile(inviteHtml)
    }
    // Serve specific HTML files (e.g. /invite.html) directly if they exist
    const specificFile = join(distPath, req.path)
    if (req.path !== '/' && req.path.endsWith('.html') && existsSync(specificFile)) {
      return res.sendFile(specificFile)
    }
    return res.sendFile(join(distPath, 'index.html'))
  }
  res.status(200).json({ status: 'Kiwi LLM API is running', message: 'Ready to receive requests.' })
})

app.listen(port, () => {
  console.log(`Kiwi LLM server running on port ${port}`)
})
