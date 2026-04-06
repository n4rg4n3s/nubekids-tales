import { createTenantConfig } from '../tenantConfigFactory';

export const directB2cConfig = createTenantConfig({
  tenantId: 'direct-b2c',
  tenantName: 'NubeKids Stories',
  verticalId: 'direct-b2c',
  itemInteractionMode: 'generic',
  integrationLevel: 'b2c',
  brandColors: {
    primary: '#8B5CF6',
    accent: '#FBBF24',
    background: '#FDFBF7',
  },
});
