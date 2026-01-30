/**
 * Pagination Utilities
 *
 * Helpers for handling pagination with Cloudflare API.
 */

import type { PaginatedResponse, PaginationParams, ResultInfo } from '../types/cloudflare.js';

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  per_page: 20,
  maxPerPage: 100,
} as const;

/**
 * Normalize pagination parameters
 */
export function normalizePaginationParams(
  params?: PaginationParams,
  maxPerPage = PAGINATION_DEFAULTS.maxPerPage
): Required<PaginationParams> {
  return {
    page: params?.page || PAGINATION_DEFAULTS.page,
    per_page: Math.min(params?.per_page || PAGINATION_DEFAULTS.per_page, maxPerPage),
  };
}

/**
 * Create an empty paginated response
 */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    items: [],
    count: 0,
    hasMore: false,
  };
}

/**
 * Create a paginated response from Cloudflare API result_info
 */
export function createPaginatedResponse<T>(
  items: T[],
  resultInfo?: ResultInfo
): PaginatedResponse<T> {
  if (!resultInfo) {
    return {
      items,
      count: items.length,
      hasMore: false,
    };
  }

  return {
    items,
    count: resultInfo.count,
    total: resultInfo.total_count,
    hasMore: resultInfo.page < resultInfo.total_pages,
    page: resultInfo.page,
    totalPages: resultInfo.total_pages,
  };
}

/**
 * Build query string from pagination params
 */
export function buildPaginationQuery(params?: PaginationParams): URLSearchParams {
  const normalized = normalizePaginationParams(params);
  const queryParams = new URLSearchParams();
  queryParams.set('page', String(normalized.page));
  queryParams.set('per_page', String(normalized.per_page));
  return queryParams;
}
