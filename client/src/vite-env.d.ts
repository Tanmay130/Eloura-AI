/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev-only: Vite proxy target for /api (see vite.config.ts). */
  readonly VITE_API_URL: string;
  /** Split-deploy: absolute server URL the browser calls (e.g. Render URL). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
