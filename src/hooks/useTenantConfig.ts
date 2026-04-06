// src/hooks/useTenantConfig.ts
import { useState } from 'react';
import type { TenantConfig } from '../types';
import { loadTenantConfig, getTenantIdFromUrl, getInjectedItemModel } from '../config/tenantLoader';

interface UseTenantConfigReturn {
  tenantConfig: TenantConfig;
  tenantId: string;
  injectedItemModel: string | null;
  isLoading: boolean;
}

/**
 * Hook to load and expose tenant configuration.
 *
 * Usage:
 *   const { tenantConfig, injectedItemModel } = useTenantConfig();
 *
 *   // Access tenant-specific values
 *   console.log(tenantConfig.itemLabel); // etiqueta breve para prompts
 *   console.log(tenantConfig.brandColors.primary); // "#8B5CF6"
 *
 * IMPORTANTE:
 *   Este hook sigue siendo útil para demo/local.
 *   El flujo B2B real por token construye la config desde datos reales del tenant.
 */
export function useTenantConfig(): UseTenantConfigReturn {
  const [tenantId] = useState<string>(() => getTenantIdFromUrl());
  const [tenantConfig] = useState<TenantConfig>(() => loadTenantConfig(tenantId));
  const [injectedItemModel] = useState<string | null>(() => getInjectedItemModel());
  const isLoading = false;

  return {
    tenantConfig,
    tenantId,
    injectedItemModel,
    isLoading,
  };
}
