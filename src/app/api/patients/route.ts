import { NextRequest } from 'next/server';
import { proxyToBackend } from '../lib/backend';

// Patients API proxy
export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/patients');
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/patients');
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '/patients');
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/patients${url.pathname.replace('/api/patients', '')}`;
  return proxyToBackend(request, endpoint);
}

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, '/patients');
}