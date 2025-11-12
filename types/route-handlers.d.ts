// Type definitions for Next.js App Router route handlers
import { NextRequest } from 'next/server';

export interface RouteContext<T = Record<string, string>> {
  params: T;
}

export interface DynamicRouteContext {
  params: {
    id: string;
  };
}

// These types can be used in any route handler:
//
// import { RouteContext } from '@/types/route-handlers';
//
// export async function GET(
//   request: NextRequest,
//   context: RouteContext<{ id: string }>
// ) {
//   const { id } = context.params;
//   // ...
// } 