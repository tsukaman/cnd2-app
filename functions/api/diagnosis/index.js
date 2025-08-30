/**
 * Cloudflare Pages Functions for diagnosis API with KV storage
 * This runs on Cloudflare's edge network with native KV support
 */

// Rate limiting configuration
const RATE_LIMIT = {
  WINDOW_MS: 60000, // 1 minute
  MAX_REQUESTS: 10  // 10 requests per minute per IP
};

// Simple rate limiter using KV
async function checkRateLimit(env, ip) {
  const key = `rate:${ip}`;
  const now = Date.now();
  
  try {
    const data = await env.DIAGNOSIS_KV.get(key, { type: 'json' });
    
    if (!data || now > data.resetTime) {
      await env.DIAGNOSIS_KV.put(
        key,
        JSON.stringify({ count: 1, resetTime: now + RATE_LIMIT.WINDOW_MS }),
        { expirationTtl: 120 } // 2 minutes TTL
      );
      return true;
    }
    
    if (data.count >= RATE_LIMIT.MAX_REQUESTS) {
      return false;
    }
    
    data.count++;
    await env.DIAGNOSIS_KV.put(
      key,
      JSON.stringify(data),
      { expirationTtl: 120 }
    );
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow on error
  }
}

// Store diagnosis result in KV
async function storeDiagnosisResult(env, result) {
  try {
    const key = `diagnosis:${result.id}`;
    await env.DIAGNOSIS_KV.put(
      key,
      JSON.stringify(result),
      { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
    );
    return true;
  } catch (error) {
    console.error('Failed to store diagnosis result:', error);
    return false;
  }
}

// Get diagnosis result from KV
async function getDiagnosisResult(env, id) {
  try {
    const key = `diagnosis:${id}`;
    const data = await env.DIAGNOSIS_KV.get(key, { type: 'json' });
    return data;
  } catch (error) {
    console.error('Failed to get diagnosis result:', error);
    return null;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               'unknown';
    
    // Check rate limit if KV is available
    if (env.DIAGNOSIS_KV) {
      const allowed = await checkRateLimit(env, ip);
      if (!allowed) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Too many requests. Please try again later.'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    const { profiles, mode, resultId } = await request.json();
    
    // If this is a result retrieval request
    if (resultId && env.DIAGNOSIS_KV) {
      const result = await getDiagnosisResult(env, resultId);
      if (result) {
        return new Response(JSON.stringify({
          success: true,
          data: result
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Validate input
    if (!profiles || !Array.isArray(profiles) || profiles.length < 2) {
      return new Response(JSON.stringify({
        success: false,
        error: 'At least 2 profiles are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Import v4 astrology-style diagnosis with OpenAI
    const { generateAstrologicalDiagnosis } = require('../diagnosis-v4-openai');
    
    // Generate diagnosis using v4 OpenAI engine
    const diagnosisData = await generateAstrologicalDiagnosis(profiles, mode || 'duo', env);
    
    // Create full result object
    const result = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      mode: mode || 'duo',
      ...diagnosisData,
      participants: profiles,
      createdAt: new Date().toISOString()
    };
    
    // Store result in KV if available
    if (env.DIAGNOSIS_KV) {
      await storeDiagnosisResult(env, result);
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        result,
        aiPowered: result.aiPowered || false
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Diagnosis API] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate diagnosis'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Result ID is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (!env.DIAGNOSIS_KV) {
    return new Response(JSON.stringify({
      success: false,
      error: 'KV storage not available'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const result = await getDiagnosisResult(env, id);
  
  if (!result) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Result not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({
    success: true,
    data: result
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}