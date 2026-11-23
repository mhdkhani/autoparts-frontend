/** Server-side only: a required setting from infra/.env (read at request time, never baked into the build). */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name} (set it in infra/.env)`);
  return value;
}
