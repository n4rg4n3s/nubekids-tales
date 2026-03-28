// src/config/tenantLoader.ts
import type { TenantConfig } from '../types';
import { shoeStoreConfig } from './tenants/shoe-store.config';
import { fashionStoreConfig } from './tenants/fashion-store.config';
import { directB2cConfig } from './tenants/direct-b2c.config';

/**
 * TENANT LOADER
 * 
 * Reads tenant_id from:
 * 1. Query param: ?tenant=shoe-store-default
 * 2. Fallback: direct-b2c (default for B2C users)
 * 
 * In V2: This will fetch config from API instead of local files.
 */

const TENANT_CONFIGS: Record<string, TenantConfig> = {
  'shoe-store-default': shoeStoreConfig,
  'fashion-store-default': fashionStoreConfig,
  'direct-b2c': directB2cConfig,
};

export function getTenantIdFromUrl(): string {
  if (typeof window === 'undefined') return 'direct-b2c';

  const params = new URLSearchParams(window.location.search);
  return params.get('tenant') ?? 'direct-b2c';
}

export function loadTenantConfig(tenantId?: string): TenantConfig {
  const id = tenantId ?? getTenantIdFromUrl();

  const config = TENANT_CONFIGS[id];

  if (!config) {
    console.warn(`Tenant "${id}" not found. Falling back to direct-b2c.`);
    return directB2cConfig;
  }

  return config;
}

export function getInjectedItemModel(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  return params.get('item');
}

export function getAllTenantIds(): string[] {
  return Object.keys(TENANT_CONFIGS);
}