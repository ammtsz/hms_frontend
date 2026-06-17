import { NextRequest } from 'next/server';
import { proxyToBackend } from '../../lib/backend';

// Auth me endpoint proxy
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/auth/me');
}