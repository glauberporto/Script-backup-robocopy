import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Copy,
  Download,
  FileCode2,
  FileSpreadsheet,
  Menu,
  Shield,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { BackupConfig, WorkspaceSection } from './types/backup';
import {
  DEFAULT_BACKUP_CONFIG,
  downloadBatchFile,
  generateBatchScript,
} from './utils/batchGenerator';
import { BatchConfigurator } from './components/BatchConfigurator';
import { FlagsReference } from './components/FlagsReference';
import { SchedulerAndAuth } from './components/SchedulerAndAuth';
import { LogsAndErrorLevel } from './components/LogsAndErrorLevel';

const STORAGE_KEY = 'robocopy_backup_arvore_config_v1';

function loadInitialConfig(): BackupConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BACKUP_CONFIG;
    const parsed = JSON.parse(raw) as Partial<BackupConfig>;
    return {
      ...DEFAULT_BACKUP_CONFIG,
      ...parsed,
      flags: {
        ...DEFAULT_BACKUP_CONFIG.flags,
        ...(parsed.flags || {}),
      },
    };
  } catch {
    return DEFAULT_BACKUP_CONFIG;
  }
}

const NAV_ITEMS: Array<{
  id: WorkspaceSection;
  label: string;
  breadcrumb: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'generator',
    label: 'Gerador de Script',
    breadcrumb: 'Gerador de Script (.bat)',
    icon: FileCode2,
  },
  {
    id: 'flags',
    label: 'Flags & Performance',
    breadcrumb: 'Flags & Performance',
    icon: SlidersHorizontal,
  },
  {
    id: 'scheduler',
    label: 'Agendador & SMB',
    breadcrumb: 'Agendador & Credenciais SMB',
    icon: CalendarClock,
  },
  {
    id: 'logs',
    label: 'Logs & ERRORLEVEL',
    breadcrumb: 'Auditoria de Logs & ERRORLEVEL',
    icon: FileSpreadsheet,
  },
];

export default function App() {
  const [section, setSection] = useState<WorkspaceSection>('generator');
  const [config, setConfig] = useState<BackupConfig>(loadInitialConfig);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedTop, setCopiedTop] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Ignore storage quota errors
    }
  }, [config]);

  const generatedScript = useMemo(() => generateBatchScript(config), [config]);

  const currentNav = NAV_ITEMS.find((item) => item.id === section) || NAV_ITEMS[0];

  const handleCopyTop = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript.replace(/\r?\n/g, '\r\n'));
      setCopiedTop(true);
      setTimeout(() => setCopiedTop(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSelectSection = (id: WorkspaceSection) => {
    setSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (256px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-150 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
              Backup Árvore
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Fechar navegação"
            className="lg:hidden p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quiet specifications footer */}
        <div className="p-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
          <div className="font-medium text-slate-700">Pré-requisitos do Ambiente</div>
          <div>Windows Server 2012 ou superior</div>
          <div>Robocopy nativo · Acesso SMB</div>
          <div className="pt-1 text-slate-400">Licença MIT</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir navegação"
              className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-slate-500 whitespace-nowrap shrink-0 hidden sm:inline">
                Windows Server / Robocopy
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {currentNav.breadcrumb}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedTop ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Copiar Script</span>
                  <span className="sm:hidden">Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => downloadBatchFile(config.scriptName, generatedScript)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar {config.scriptName}</span>
              <span className="sm:hidden">Baixar .bat</span>
            </button>
          </div>
        </header>

        {/* Main Scroll Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {section === 'generator' && (
            <BatchConfigurator
              config={config}
              script={generatedScript}
              onChange={setConfig}
            />
          )}

          {section === 'flags' && (
            <FlagsReference config={config} onChange={setConfig} />
          )}

          {section === 'scheduler' && (
            <SchedulerAndAuth
              config={config}
              onEnableScheduledMode={() =>
                setConfig((prev) => ({ ...prev, scheduledMode: true }))
              }
            />
          )}

          {section === 'logs' && <LogsAndErrorLevel config={config} />}
        </main>
      </div>
    </div>
  );
}
