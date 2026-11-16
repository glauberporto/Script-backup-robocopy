import React from 'react';
import { AlertTriangle, RotateCcw, Server, HardDrive, FolderOutput } from 'lucide-react';
import { BackupConfig, RobocopyFlags } from '../types/backup';
import { DEFAULT_BACKUP_CONFIG } from '../utils/batchGenerator';
import { BatchCodeViewer } from './BatchCodeViewer';

interface BatchConfiguratorProps {
  config: BackupConfig;
  script: string;
  onChange: (next: BackupConfig) => void;
}

interface PresetItem {
  id: string;
  label: string;
  apply: (current: BackupConfig) => BackupConfig;
}

const PRESETS: PresetItem[] = [
  {
    id: 'smb-usb',
    label: 'SMB → HD Externo USB',
    apply: (current) => ({
      ...current,
      origem: '\\\\SERVIDOR-ORIGEM\\Compartilhamento',
      destinoDrive: 'D:',
      destinoPasta: '%DESTINO_DRIVE%\\Backup_Full',
      logDir: 'C:\\Scripts\\Logs',
      scheduledMode: true,
      retries: 3,
      waitSeconds: 5,
      flags: {
        ...current.flags,
        mir: true,
        copyAll: true,
        dcopyDat: true,
        backupMode: true,
        unbuffered: true,
        mtEnabled: true,
        mtThreads: 16,
        fft: true,
        xj: true,
        np: true,
        tee: false,
        dryRun: false,
      },
    }),
  },
  {
    id: 'nas-samba',
    label: 'NAS Samba / Linux → RAID Local',
    apply: (current) => ({
      ...current,
      origem: '\\\\192.168.10.25\\Arquivos_Empresa',
      destinoDrive: 'E:',
      destinoPasta: '%DESTINO_DRIVE%\\Espelho_NAS',
      logDir: 'C:\\Scripts\\Logs',
      scheduledMode: true,
      retries: 5,
      waitSeconds: 10,
      flags: {
        ...current.flags,
        mir: true,
        copyAll: false,
        dcopyDat: true,
        backupMode: true,
        unbuffered: true,
        mtEnabled: true,
        mtThreads: 32,
        fft: true,
        xj: true,
        np: true,
        tee: false,
        dryRun: false,
      },
    }),
  },
  {
    id: 'manual-test',
    label: 'Teste Manual Interativo',
    apply: (current) => ({
      ...current,
      scheduledMode: false,
      flags: {
        ...current.flags,
        tee: true,
      },
    }),
  },
];

export const BatchConfigurator: React.FC<BatchConfiguratorProps> = ({
  config,
  script,
  onChange,
}) => {
  const updateField = <K extends keyof BackupConfig>(key: K, value: BackupConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const updateFlag = <K extends keyof RobocopyFlags>(key: K, value: RobocopyFlags[K]) => {
    onChange({
      ...config,
      flags: {
        ...config.flags,
        [key]: value,
      },
    });
  };

  const flagRows: Array<{
    key: keyof RobocopyFlags;
    flag: string;
    title: string;
    desc: string;
  }> = [
    {
      key: 'mir',
      flag: '/MIR',
      title: 'Espelhamento Inteligente',
      desc: 'Sincroniza origem e destino copiando apenas arquivos novos ou alterados.',
    },
    {
      key: 'copyAll',
      flag: '/COPYALL',
      title: 'Preservar ACLs NTFS e Proprietário',
      desc: 'Mantém permissões de segurança, proprietários, atributos e auditoria.',
    },
    {
      key: 'dcopyDat',
      flag: '/DCOPY:DAT',
      title: 'Preservar Datas de Diretórios',
      desc: 'Mantém timestamps e atributos originais das pastas no destino.',
    },
    {
      key: 'backupMode',
      flag: '/B',
      title: 'Modo Backup (SeBackupPrivilege)',
      desc: 'Reduz sobrecarga em redes cabeadas e contorna restrições de ACL.',
    },
    {
      key: 'unbuffered',
      flag: '/J',
      title: 'Unbuffered I/O',
      desc: 'Evita saturação de RAM ao transferir arquivos de grande porte.',
    },
    {
      key: 'fft',
      flag: '/FFT',
      title: 'Tolerância de 2s em Timestamps',
      desc: 'Evita recópias desnecessárias entre servidores Windows e NAS.',
    },
    {
      key: 'xj',
      flag: '/XJ',
      title: 'Excluir Junction Points',
      desc: 'Previne loops infinitos em links simbólicos e perfis de sistema.',
    },
    {
      key: 'np',
      flag: '/NP',
      title: 'Omitir Percentual de Progresso',
      desc: 'Mantém os arquivos de log limpos e fáceis de auditar.',
    },
    {
      key: 'tee',
      flag: '/TEE',
      title: 'Exibir Saída no Console',
      desc: 'Imprime o progresso na tela além de gravar no arquivo de log.',
    },
    {
      key: 'dryRun',
      flag: '/L',
      title: 'Modo Simulação (Dry-run)',
      desc: 'Lista apenas o que seria copiado ou removido, sem gravar ou apagar arquivos.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Context strip + Quick presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Configurador do Script Batch (.bat)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Ajuste caminhos SMB, unidade de destino e parâmetros de I/O do Robocopy para Windows Server 2012 ou superior.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.apply(config))}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(DEFAULT_BACKUP_CONFIG)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar padrão</span>
          </button>
        </div>
      </div>

      {/* Main 2-column workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration Form */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {/* 01. Variáveis de Ambiente */}
          <section className="p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                01. Variáveis de Ambiente e Caminhos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Definidas no cabeçalho do arquivo para adaptação rápida ao ambiente.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label
                  htmlFor="input-origem"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5"
                >
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  <span>ORIGEM (Compartilhamento SMB ou pasta local)</span>
                </label>
                <input
                  id="input-origem"
                  type="text"
                  value={config.origem}
                  onChange={(e) => updateField('origem', e.target.value)}
                  placeholder="\\SERVIDOR-ORIGEM\Compartilhamento"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="input-drive"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>DESTINO_DRIVE</span>
                  </label>
                  <input
                    id="input-drive"
                    type="text"
                    value={config.destinoDrive}
                    onChange={(e) => updateField('destinoDrive', e.target.value)}
                    placeholder="D:"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="input-pasta"
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1.5"
                  >
                    <FolderOutput className="w-3.5 h-3.5 text-slate-400" />
                    <span>DESTINO_PASTA</span>
                  </label>
                  <input
                    id="input-pasta"
                    type="text"
                    value={config.destinoPasta}
                    onChange={(e) => updateField('destinoPasta', e.target.value)}
                    placeholder="%DESTINO_DRIVE%\Backup_Full"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-logdir"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  LOG_DIR (Diretório de registros e auditoria)
                </label>
                <input
                  id="input-logdir"
                  type="text"
                  value={config.logDir}
                  onChange={(e) => updateField('logDir', e.target.value)}
                  placeholder="C:\Scripts\Logs"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label
                    htmlFor="input-scriptdir"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Pasta do script (Iniciar em)
                  </label>
                  <input
                    id="input-scriptdir"
                    type="text"
                    value={config.scriptDir}
                    onChange={(e) => updateField('scriptDir', e.target.value)}
                    placeholder="C:\Scripts"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-scriptname"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Nome do arquivo
                  </label>
                  <input
                    id="input-scriptname"
                    type="text"
                    value={config.scriptName}
                    onChange={(e) => updateField('scriptName', e.target.value)}
                    placeholder="backup_arvore.bat"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 02. Comportamento de Execução (Agendado vs Interativo) */}
          <section className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  02. Modo de Execução (pause)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Em segundo plano via Agendador de Tarefas, o comando pause trava o processo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => updateField('scheduledMode', true)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  config.scheduledMode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Agendado (:: pause)
              </button>
              <button
                type="button"
                onClick={() => updateField('scheduledMode', false)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  !config.scheduledMode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Interativo (pause)
              </button>
            </div>

            {!config.scheduledMode && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Com <code className="font-mono font-semibold">pause</code> ativo, o script aguardará interação de teclado ao finalizar. Comente antes de agendar no Task Scheduler.
                </span>
              </div>
            )}
          </section>

          {/* 03. Performance e Flags do Robocopy */}
          <section className="p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                03. Flags Robocopy & Calibragem de I/O
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ative ou ajuste os parâmetros de espelhamento, permissões NTFS, threads e simulação.
              </p>
            </div>

            {config.flags.dryRun && (
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Modo <strong>Dry-run (<code className="font-mono font-semibold">/L</code>)</strong> ativo: o Robocopy apenas simulará as operações no log sem copiar ou excluir arquivos reais.
                </span>
              </div>
            )}

            {/* Multithreading calibration */}
            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.flags.mtEnabled}
                    onChange={(e) => updateFlag('mtEnabled', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-xs font-semibold text-slate-900">
                    Multithreading <code className="font-mono text-blue-700">/MT:{config.flags.mtThreads}</code>
                  </span>
                </label>
                <span className="text-xs font-mono text-slate-600 tabular-nums">
                  {config.flags.mtThreads} threads
                </span>
              </div>

              {config.flags.mtEnabled && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min={1}
                    max={64}
                    step={1}
                    value={config.flags.mtThreads}
                    onChange={(e) => updateFlag('mtThreads', Number(e.target.value))}
                    aria-label="Número de threads Robocopy /MT"
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>1 (Serial)</span>
                    <span>16 (Recomendado USB)</span>
                    <span>64 (NVMe/RAID)</span>
                  </div>
                  {config.flags.mtThreads > 24 && (
                    <p className="text-[11px] text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Acima de 24 threads pode causar gargalo de fila I/O em HDs externos USB.
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Retry / Wait */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="input-retries"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Retentativas (<code className="font-mono">/R</code>)
                </label>
                <input
                  id="input-retries"
                  type="number"
                  min={0}
                  max={100}
                  value={config.retries}
                  onChange={(e) => updateField('retries', Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
              <div>
                <label
                  htmlFor="input-wait"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Espera em seg (<code className="font-mono">/W</code>)
                </label>
                <input
                  id="input-wait"
                  type="number"
                  min={0}
                  max={300}
                  value={config.waitSeconds}
                  onChange={(e) => updateField('waitSeconds', Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Individual flag checkboxes */}
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {flagRows.map((item) => {
                const checked = Boolean(config.flags[item.key]);
                return (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-slate-50/70 -mx-2 px-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => updateFlag(item.key, e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <code className="font-mono font-semibold text-blue-700">
                          {item.flag}
                        </code>
                        <span className="text-slate-400" aria-hidden="true">·</span>
                        <span className="font-medium text-slate-900">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {config.exclusions.trim() && (
              <div className="pt-3 border-t border-slate-100 text-xs space-y-1">
                <div className="font-medium text-slate-700">
                  Exclusões ativas (<code className="font-mono text-blue-700">/XF</code> ·{' '}
                  <code className="font-mono text-blue-700">/XD</code>)
                </div>
                <p className="font-mono text-[11px] text-slate-600 break-all">
                  {config.exclusions}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right: Live Script Preview */}
        <div className="xl:col-span-7 xl:sticky xl:top-6 space-y-4">
          <BatchCodeViewer
            script={script}
            filename={config.scriptName}
            scriptDir={config.scriptDir}
            scheduledMode={config.scheduledMode}
          />

          <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-slate-500">Compatibilidade</div>
              <div className="font-medium text-slate-900 mt-0.5">
                Windows Server 2012+
              </div>
            </div>
            <div>
              <div className="text-slate-500">Modo de Operação</div>
              <div className="font-medium text-slate-900 mt-0.5">
                {config.flags.dryRun
                  ? 'Simulação (/L · Dry-run)'
                  : `Produção (${config.destinoDrive || 'D:'})`}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Avaliação de saída</div>
              <div className="font-medium text-slate-900 mt-0.5 font-mono tabular-nums">
                ERRORLEVEL &lt; 8 = OK
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
