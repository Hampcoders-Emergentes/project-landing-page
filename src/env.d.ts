interface ImportMetaEnv {
  readonly PUBLIC_WEBAPP_URL?: string;
  readonly PUBLIC_DEMO_ENDPOINT?: string;
  readonly PUBLIC_STATUS_ENDPOINT?: string;
  readonly PUBLIC_STATUS_PAGE_URL?: string;
  readonly PUBLIC_DOCS_URL?: string;
  readonly PUBLIC_PRIVACY_URL?: string;
  readonly PUBLIC_TERMS_URL?: string;
  readonly PUBLIC_SUPPORT_PHONE?: string;
  readonly PUBLIC_SALES_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
