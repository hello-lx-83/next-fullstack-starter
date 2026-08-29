import "server-only";

import { getServerEnv } from "@/config/env";

import { readdir, stat } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";

export type DataProtectionStatus = {
  databaseFileName: string;
  backupCount: number;
  latestBackupAt: string | null;
  usesCustomBackupDirectory: boolean;
};

export async function getDataProtectionStatus(): Promise<DataProtectionStatus> {
  const env = getServerEnv();
  const databasePath = resolve(env.DATABASE_URL.replace(/^file:/, ""));
  const databaseFileName = basename(databasePath);
  const databaseBaseName = basename(databasePath, extname(databasePath));
  const databaseExtension = extname(databasePath) || ".db";
  const backupDirectory = env.BACKUP_DIRECTORY ? resolve(env.BACKUP_DIRECTORY) : join(dirname(databasePath), "backups");

  try {
    const entries = await readdir(backupDirectory, { withFileTypes: true });
    const backupNames = entries
      .filter(
        (entry) =>
          entry.isFile() && entry.name.startsWith(`${databaseBaseName}-`) && entry.name.endsWith(databaseExtension),
      )
      .map((entry) => entry.name);
    const backupStats = await Promise.all(backupNames.map((name) => stat(join(backupDirectory, name))));
    const latestModifiedAt = backupStats.reduce<number | null>(
      (latest, item) => (latest === null || item.mtimeMs > latest ? item.mtimeMs : latest),
      null,
    );

    return {
      databaseFileName,
      backupCount: backupNames.length,
      latestBackupAt: latestModifiedAt === null ? null : new Date(latestModifiedAt).toISOString(),
      usesCustomBackupDirectory: Boolean(env.BACKUP_DIRECTORY),
    };
  } catch {
    return {
      databaseFileName,
      backupCount: 0,
      latestBackupAt: null,
      usesCustomBackupDirectory: Boolean(env.BACKUP_DIRECTORY),
    };
  }
}
