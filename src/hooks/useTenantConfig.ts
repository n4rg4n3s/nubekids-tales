// src/hooks/useTenantConfig.ts
import { useState, useEffect } from 'react';
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
 *   console.log(tenantConfig.itemLabel); // "zapatos" | "prenda" | "objeto especial"
 *   console.log(tenantConfig.brandColors.primary); // "#8B5CF6"
 */
export function useTenantConfig(): UseTenantConfigReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>('direct-b2c');
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(() => loadTenantConfig());
  const [injectedItemModel, setInjectedItemModel] = useState<string | null>(null);

  useEffect(() => {
    // Read tenant from URL
    const id = getTenantIdFromUrl();
    setTenantId(id);
    
    // Load tenant config
    const config = loadTenantConfig(id);
    setTenantConfig(config);
    
    // Check for injected item from checkout
    const item = getInjectedItemModel();
    setInjectedItemModel(item);
    
    setIsLoading(false);
  }, []);

  return {
    tenantConfig,
    tenantId,
    injectedItemModel,
    isLoading,
  };
}
