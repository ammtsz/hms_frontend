import { NextRequest } from 'next/server';
import { proxyToBackend } from '../lib/backend';

// Attendances API proxy
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/attendances${url.pathname.replace('/api/attendances', '')}${url.search}`;
  return proxyToBackend(request, endpoint);
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/attendances');
}

export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/attendances${url.pathname.replace('/api/attendances', '')}`;
  return proxyToBackend(request, endpoint);
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/attendances${url.pathname.replace('/api/attendances', '')}`;
  return proxyToBackend(request, endpoint);
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/attendances${url.pathname.replace('/api/attendances', '')}`;
  return proxyToBackend(request, endpoint);
}