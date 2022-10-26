import { setupLayouts } from 'virtual:generated-layouts';
import generatedRoutes from 'virtual:generated-pages';
import { ViteSSG } from 'vite-ssg';
import App from '~/App.vue';
import type { UserModule } from '~/types';

// Font(s)
import '@mdi/font/css/materialdesignicons.css';
// Vuetify
import './styles/myVuetify.scss';
// UnoCSS (Reset)
import '@unocss/reset/tailwind.css';
// UnoCSS
import 'uno.css';
// Our own styles
import './styles/main.css';

const routes = setupLayouts(generatedRoutes);

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
  App,
  { routes },
  async (ctx): Promise<void> => {
    // install all modules under `modules/`
    for (const mod of Object.values(
      import.meta.glob<true, string, { install?: UserModule }>(
        './modules/*.ts',
        {
          eager: true,
        }
      )
    )) {
      await mod.install?.(ctx);
    }
  }
);
