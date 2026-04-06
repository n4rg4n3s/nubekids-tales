import { createTenantConfig } from '../tenantConfigFactory';

export const wearableDemoConfig = createTenantConfig({
  tenantId: 'wearable-demo-default',
  tenantName: 'NubeKids Wearable Demo',
  verticalId: 'wearable-demo',
  itemInteractionMode: 'wearable',
  integrationLevel: 'standard',
  storeName: 'NubeKids Wearable Demo',
  brandColors: {
    primary: '#0F766E',
    accent: '#F59E0B',
    background: '#F7FEFC',
  },
});
