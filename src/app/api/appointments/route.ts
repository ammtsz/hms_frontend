import { NextRequest } from 'next/server';
import { proxyToBackend } from '../lib/backend';

// Appointments API proxy
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/appointments${url.pathname.replace('/api/appointments', '')}${url.search}`;
  return proxyToBackend(request, endpoint);
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/appointments');
}

export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/appointments${url.pathname.replace('/api/appointments', '')}`;
  return proxyToBackend(request, endpoint);
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/appointments${url.pathname.replace('/api/appointments', '')}`;
  return proxyToBackend(request, endpoint);
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = `/appointments${url.pathname.replace('/api/appointments', '')}`;
  return proxyToBackend(request, endpoint);
}