import { pathToFileURL } from 'node:url';

/** True when the module is the process entry point instead of being imported. */
export const isEntry = (metaUrl: string, argv: string[] = process.argv): boolean => {
  const entry = argv[1];
  return !!entry && metaUrl === pathToFileURL(entry).href;
};
