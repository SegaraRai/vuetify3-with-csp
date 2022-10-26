/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTENT_SECURITY_POLICY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
