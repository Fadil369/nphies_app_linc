// Cloudflare Pages Functions for additional API endpoints
// This file handles any additional serverless functions needed

export async function onRequest(context) {
  const { request, env } = context
  
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  // Health check for Pages Functions
  if (new URL(request.url).pathname === '/api/health') {
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cloudflare-pages-functions'
    }, {
      headers: corsHeaders
    })
  }

  // Fallback to 404
  return new Response('Not Found', { 
    status: 404,
    headers: corsHeaders
  })
}