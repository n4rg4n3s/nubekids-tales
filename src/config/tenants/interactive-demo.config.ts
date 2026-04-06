import { createTenantConfig } from '../tenantConfigFactory';

export const interactiveDemoConfig = createTenantConfig({
  tenantId: 'interactive-demo-default',
  tenantName: 'NubeKids Interactive Demo',
  verticalId: 'interactive-demo',
  itemInteractionMode: 'interactive',
  integrationLevel: 'standard',
  storeName: 'NubeKids Interactive Demo',
  brandColors: {
    primary: '#2563EB',
    accent: '#F97316',
    background: '#F8FAFF',
  },
});
