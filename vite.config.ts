import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';
import Vue from '@vitejs/plugin-vue';
import fg from 'fast-glob';
import { presetAttributify, presetIcons, presetUno } from 'unocss';
import UnoCSS from 'unocss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import Components from 'unplugin-vue-components/vite';
import { Plugin, defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import Inspect from 'vite-plugin-inspect';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import Vuetify from 'vite-plugin-vuetify';
import type { createVuetify } from 'vuetify';

interface EmitTemplatedFilePluginOptions {
  readonly srcDir: string;
  readonly paramMap: Readonly<Record<string, string>>;
}

function emitTemplatedFilePlugin({
  srcDir,
  paramMap,
}: EmitTemplatedFilePluginOptions): Plugin {
  const REPLACE_RE = /\$\{([^}]+)\}/g;

  const transform = (
    content: string,
    map: Readonly<Record<string, string | undefined>>
  ): string =>
    content.replace(REPLACE_RE, (_, key) => {
      const replacement = map[key];
      if (replacement == null) {
        throw new Error(`Missing param: ${key}`);
      }
      return replacement;
    });

  return {
    name: 'emitTemplatedFilePlugin',
    apply: 'build',
    enforce: 'pre',
    async generateBundle(): Promise<void> {
      const root = path.resolve(process.cwd(), srcDir);
      const files = await fg('**/*', {
        cwd: root,
      });

      for (const file of files) {
        const content = await readFile(path.resolve(root, file), 'utf-8');
        this.emitFile({
          type: 'asset',
          fileName: file,
          source: transform(content, paramMap),
        });
      }
    },
  };
}

function getVuetifyStyles(vuetify: ReturnType<typeof createVuetify>): string[] {
  const styleSet = new Set<string>();
  styleSet.add(vuetify.theme.styles.value);
  for (const themeName of Object.keys(vuetify.theme.themes.value)) {
    vuetify.theme.global.name.value = themeName;
    styleSet.add(vuetify.theme.styles.value);
  }
  return Array.from(styleSet);
}

function getCSPHash(
  content: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  return `'${algorithm}-${createHash(algorithm)
    .update(content)
    .digest('base64')}'`;
}

export default defineConfig(async ({ mode }) => {
  const IS_DEV = mode === 'development';

  const vuetify3ThemeNonces = getVuetifyStyles(
    await (await import('./src/modules/vuetify')).createMyVuetify()
  )
    .map((content) => ' ' + getCSPHash(content, 'sha512'))
    .join('');

  console.log('vuetify3ThemeNonces', vuetify3ThemeNonces);

  const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "connect-src 'self' https://cloudflareinsights.com",
    `script-src 'self' https://static.cloudflareinsights.com${
      IS_DEV ? " 'unsafe-eval' 'unsafe-inline'" : ''
    }`,
    // 'unsafe-inline' will be ignored if 'nonce-...' or hash is present so we have to skip adding vuetify3ThemeNonces in dev mode
    `style-src 'self'${IS_DEV ? " 'unsafe-inline'" : vuetify3ThemeNonces}`,
  ].join('; ');

  process.env.VITE_CONTENT_SECURITY_POLICY = CONTENT_SECURITY_POLICY;

  return {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[hash][extname]',
          entryFileNames: 'assets/[hash].js',
          chunkFileNames: 'assets/[hash].js',
        },
      },
    },
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
      },
    },
    plugins: [
      emitTemplatedFilePlugin({
        srcDir: 'templates',
        paramMap: {
          CONTENT_SECURITY_POLICY,
        },
      }),

      createHtmlPlugin({
        inject: {
          tags: [
            {
              injectTo: 'head',
              tag: 'meta',
              attrs: {
                'http-equiv': 'Content-Security-Policy',
                content: CONTENT_SECURITY_POLICY,
              },
            },
          ],
        },
        minify: false,
      }),

      Vue({
        include: [/\.vue$/, /\.md$/],
      }),

      // https://github.com/hannoeru/vite-plugin-pages
      Pages({
        extensions: ['vue', 'md'],
      }),

      // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
      Layouts(),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core', '@vueuse/head'],
        dts: 'src/auto-imports.d.ts',
      }),

      // https://github.com/antfu/unplugin-vue-components
      Components({
        extensions: ['vue', 'md', 'svg'],

        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

        // custom resolvers
        resolvers: [
          // auto import icons
          // https://github.com/antfu/unplugin-icons
          IconsResolver({
            // enabledCollections: ['carbon']
          }),
        ],

        dts: 'src/components.d.ts',
      }),

      // https://github.com/antfu/unplugin-icons
      Icons({
        autoInstall: true,
        scale: 1.25,
      }),

      // https://github.com/unocss/unocss
      UnoCSS({
        presets: [
          presetAttributify(),
          presetIcons({
            scale: 1,
          }),
          presetUno(),
        ],
      }),

      // https://github.com/antfu/vite-plugin-inspect
      Inspect({
        // change this to enable inspect for debugging
        enabled: false,
      }),

      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
      Vuetify({
        autoImport: true,
      }),
    ],

    server: {
      host: '0.0.0.0',
      fs: {
        strict: true,
      },
    },

    // https://github.com/antfu/vite-ssg
    ssgOptions: {
      script: 'async',
      formatting: 'minify',
      format: 'esm',
      noExternal: [/vuetify/],
    },

    optimizeDeps: {
      include: ['vue', 'vue-router', 'vuetify', '@vueuse/core', '@vueuse/head'],
      exclude: ['vue-demi'],
    },
  };
});
