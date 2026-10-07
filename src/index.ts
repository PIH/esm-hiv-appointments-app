import { defineConfigSchema, getAsyncLifecycle } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';

const moduleName = '@pih/esm-hiv-appointments-app';

const options = {
  featureName: 'hiv-appointments',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

export const root = getAsyncLifecycle(() => import('./root.component'), options);

export const hivAppointmentsAppMenuLink = getAsyncLifecycle(
  () => import('./hiv-appointments-app-menu-link.component'),
  options,
);
