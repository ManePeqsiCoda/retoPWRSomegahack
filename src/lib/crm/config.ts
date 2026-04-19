/**
 * Configuración CRM ↔ DuckDB bóveda (spec: specs/features/CRM PQRSD persistencia DuckDB.md).
 */
export function crmDuckDbPath(): string | null {
  const p = process.env.CRM_DUCKDB_PATH?.trim();
  return p || null;
}

/** user_id de bóveda para Gateway (db/read y db/write). */
export function crmVaultUserId(): string {
  return (
    process.env.CRM_VAULT_USER_ID?.trim() ||
    process.env.DUCKCLAW_GATEWAY_USER_ID_OVERRIDE?.trim() ||
    '1726618406'
  );
}

export function crmTenantId(): string {
  return process.env.CRM_TENANT_ID?.trim() || 'PQRS';
}

export function crmAutoBootstrap(): boolean {
  return process.env.CRM_AUTO_BOOTSTRAP === 'true';
}
