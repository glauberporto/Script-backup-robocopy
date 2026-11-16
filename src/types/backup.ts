export interface RobocopyFlags {
  mir: boolean;
  copyAll: boolean;
  dcopyDat: boolean;
  backupMode: boolean;
  unbuffered: boolean;
  mtEnabled: boolean;
  mtThreads: number;
  fft: boolean;
  xj: boolean;
  np: boolean;
  tee: boolean;
  dryRun: boolean;
}

export interface BackupConfig {
  origem: string;
  destinoDrive: string;
  destinoPasta: string;
  logDir: string;
  scriptDir: string;
  scriptName: string;
  scheduledMode: boolean;
  retries: number;
  waitSeconds: number;
  exclusions: string;
  flags: RobocopyFlags;
}

export type FlagCategory =
  | 'all'
  | 'mirror'
  | 'metadata'
  | 'performance'
  | 'safety'
  | 'logging';

export interface RobocopyFlagSpec {
  id: keyof RobocopyFlags | 'retries' | 'wait';
  flag: string;
  name: string;
  category: Exclude<FlagCategory, 'all'>;
  categoryLabel: string;
  summary: string;
  detail: string;
  caution?: string;
}

export interface RobocopyExitBit {
  value: number;
  hex: string;
  label: string;
  description: string;
  isError: boolean;
}

export type WorkspaceSection =
  | 'generator'
  | 'flags'
  | 'scheduler'
  | 'logs';
