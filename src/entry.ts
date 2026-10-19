import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const real = (p: string): string => {
  try { return fs.realpathSync(p); } catch { return p; }
};

/** True when the module is the process entry point instead of being imported. */
export const isEntry = (metaUrl: string, argv: string[] = process.argv): boolean => {
  const entry = argv[1];
  if (!entry) return false;
  return real(fileURLToPath(metaUrl)) === real(entry);
};
