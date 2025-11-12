// Type definitions for Next.js App Router route handlers
import { NextRequest } from 'next/server';

// For non-dynamic routes
export type NextRequestHandler = (
  request: NextRequest
) => Promise<Response> | Response;

// For dynamic routes with parameters
export type NextDynamicRequestHandler = (
  request: NextRequest,
  { params }: { params: Record<string, string> }
) => Promise<Response> | Response;

// For route handlers with specific parameter types
export type NextParamRequestHandler<T extends Record<string, string>> = (
  request: NextRequest,
  { params }: { params: T }
) => Promise<Response> | Response; 