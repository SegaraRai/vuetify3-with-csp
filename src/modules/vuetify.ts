import { createVuetify } from 'vuetify';
import type { UserModule } from '~/types';

export async function createMyVuetify() {
  return createVuetify({
    // currently blueprints can only be imported in ESM format, so we have to either migrate the project to ESM (set type: "module" in package.json) or use dynamic import
    blueprint: (await import('vuetify/blueprints')).md3,
    display: {
      thresholds: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
        xxl: 2560,
      },
    },
  });
}

export const install: UserModule = async ({ app }) => {
  app.use(await createMyVuetify());
};
