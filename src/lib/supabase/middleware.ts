import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Simple pass-through - let client-side handle auth
  // This avoids cookie/localStorage sync issues
  return NextResponse.next({ request })
}
