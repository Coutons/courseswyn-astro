import { NextRequest, NextResponse } from 'next/server';

// Hardcoded token as fallback
const HARDCODED_TOKEN = '1983';

// Get valid tokens from environment with fallbacks
function getValidTokens(): string[] {
  const tokens = [
    // From environment variables
    process.env.ADMIN_PASSWORD,
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
    // From browser's localStorage (client-side only)
    typeof window !== 'undefined' ? localStorage.getItem('courseswyn:adminToken') : null,
    // Hardcoded fallback
    HARDCODED_TOKEN
  ];

  // Filter out empty values and normalize
  return tokens
    .filter(Boolean)
    .map(t => t?.toString().trim())
    .filter((t): t is string => !!t);
}

// Simple token verification
export async function verifyAdminToken(input: string | NextRequest): Promise<boolean> {
  let token: string | null = null;

  if (typeof input === 'string') {
    token = input;
  } else if (input instanceof NextRequest) {
    const authHeader = input.headers.get('authorization');
    token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  }

  if (!token) {
    console.log('[Auth] No token provided');
    return false;
  }

  // Normalize the input token
  const normalizedToken = token.toString().trim();
  
  // Get valid tokens
  const validTokens = getValidTokens();
  
  // Debug log (don't log actual tokens in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Auth] Verifying token. Valid tokens count:', validTokens.length);
  }
  
  const isValid = validTokens.some(validToken => {
    return validToken === normalizedToken;
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Auth] Token verification ${isValid ? 'succeeded' : 'failed'}`);
  }
  
  return isValid;
}

// Middleware for API routes
export function adminAuthMiddleware(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context: any) => {
    console.log('Auth middleware triggered for:', request.url);
    
    // Get token from headers or cookies
    const token = request.headers.get('x-admin-token') || 
                 request.cookies.get('admin-token')?.value ||
                 (request.headers.get('authorization') || '').replace('Bearer', '').trim();

    console.log('Received token:', token ? '***' + token.slice(-4) : 'none');

    if (!verifyAdminToken(token)) {
      console.error('Authentication failed for request:', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      });
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing admin token',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    console.log('Authentication successful');
    return handler(request, context);
  };
}
