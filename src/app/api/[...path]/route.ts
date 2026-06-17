import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '../lib/backend';
import { isProxyPathAllowed } from './allowlist';

function notFound(): NextResponse {
  return NextResponse.json({ message: 'Not found' }, { status: 404 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!isProxyPathAllowed(path)) return notFound();
  const url = new URL(request.url);
  const endpoint = `/${path.join('/')}${url.search}`;
  return proxyToBackend(request, endpoint);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!isProxyPathAllowed(path)) return notFound();
  const endpoint = `/${path.join('/')}`;
  return proxyToBackend(request, endpoint);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!isProxyPathAllowed(path)) return notFound();
  const endpoint = `/${path.join('/')}`;
  return proxyToBackend(request, endpoint);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!isProxyPathAllowed(path)) return notFound();
  const endpoint = `/${path.join('/')}`;
  return proxyToBackend(request, endpoint);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!isProxyPathAllowed(path)) return notFound();
  const endpoint = `/${path.join('/')}`;
  return proxyToBackend(request, endpoint);
}
