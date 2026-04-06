import { createTenantConfig } from '../tenantConfigFactory';

export const shoeStoreConfig = createTenantConfig({
  tenantId: 'shoe-store-default',
  tenantName: 'NubeKids Wearable Demo',
  verticalId: 'shoe-store',
  itemInteractionMode: 'wearable',
  integrationLevel: 'standard',
  storeName: 'NubeKids Wearable Demo',
  brandColors: {
    primary: '#0F766E',
    accent: '#F59E0B',
    background: '#F7FEFC',
  },
});
