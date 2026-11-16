import React, { useMemo, useState } from 'react';
import { Search, AlertCircle, CheckCircle2, FilterX } from 'lucide-react';
import { BackupConfig, FlagCategory, RobocopyFlags } from '../types/backup';
import {
  parseExclusionPatterns,
  ROBOCOPY_FLAGS_CATALOG,
} from '../utils/batchGenerator';

interface FlagsReferenceProps {
  config: BackupConfig;
  onChange: (next: BackupConfig) => void;
}

const CATEGORIES: Array<{ id: FlagCategory; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'mirror', label: 'Espelhamento' },
  { id: 'metadata', label: 'Metadados NTFS' },
  { id: 'performance', label: 'Performance & I/O' },
  { id: 'safety', label: 'Prevenção de Falhas' },
  { id: 'logging', label: 'Logs & Retentativas' },
];

type StorageProfile = 'usb' | 'nas' | 'raid';

const STORAGE_PROFILES: Record<
  StorageProfile,
  {
    label: string;
    mt: number;
    useJ: boolean;
    useB: boolean;
    useFft: boolean;
    notes: string;
  }
> = {
  usb: {
    label: 'HD Externo USB 3.0',
    mt: 16,
    useJ: true,
    useB: true,
    useFft: true,
    notes:
      'Calibrado para 16 threads (/MT:16) e I/O sem buffer (/J), maximizando vazão contínua sem saturar o controlador USB nem a memória RAM do servidor.',
  },
  nas: {
    label: 'NAS / Compartilhamento SMB',
    mt: 24,
    useJ: true,
    useB: true,
    useFft: true,
    notes:
      'Mantém /FFT obrigatório para evitar recópias causadas por diferença de 2 segundos nos timestamps entre sistemas Windows e Linux/Samba.',
  },
  raid: {
    label: 'Storage RAID / NVMe Local',
    mt: 32,
    useJ: true,
    useB: true,
    useFft: false,
    notes:
      'Controladoras RAID ou SSDs NVMe suportam filas de I/O mais profundas (/MT:32), aproveitando múltiplas conexões SMB paralelas.',
  },
};

export const FlagsReference: React.FC<FlagsReferenceProps> = ({ config, onChange }) => {
  const [category, setCategory] = useState<FlagCategory>('all');
  const [query, setQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<StorageProfile>('usb');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ROBOCOPY_FLAGS_CATALOG.filter((item) => {
      const catMatch = category === 'all' || item.category === category;
      const textMatch =
        !q ||
        item.flag.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [category, query]);

  const applyProfile = (profileKey: StorageProfile) => {
    setSelectedProfile(profileKey);
    const p = STORAGE_PROFILES[profileKey];
    onChange({
      ...config,
      flags: {
        ...config.flags,
        mtEnabled: true,
        mtThreads: p.mt,
        unbuffered: p.useJ,
        backupMode: p.useB,
        fft: p.useFft,
      },
    });
  };

  const isFlagActive = (id: keyof RobocopyFlags | 'retries' | 'wait'): boolean => {
    if (id === 'retries' || id === 'wait') return true;
    return Boolean(config.flags[id]);
  };

  const toggleFlag = (id: keyof RobocopyFlags | 'retries' | 'wait') => {
    if (id === 'retries' || id === 'wait') return;
    if (id === 'mtThreads') return;
    onChange({
      ...config,
      flags: {
        ...config.flags,
        [id]: !config.flags[id],
      },
    });
  };

  const profile = STORAGE_PROFILES[selectedProfile];
  const parsedExclusions = useMemo(
    () => parseExclusionPatterns(config.exclusions),
    [config.exclusions]
  );

  const appendExclusionPreset = (items: string[]) => {
    const existing = config.exclusions
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...existing, ...items]));
    onChange({ ...config, exclusions: merged.join(', ') });
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Arquitetura de Flags e Performance
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Entenda o impacto técnico de cada parâmetro do Robocopy e calibre o perfil de I/O conforme o hardware de destino.
        </p>
      </div>

      {/* Hardware Profile Calibrator */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              01. Calibragem por Mídia de Destino
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione o perfil de disco de destino para ajustar automaticamente /MT, /J, /B e /FFT no seu script.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(Object.keys(STORAGE_PROFILES) as StorageProfile[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => applyProfile(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedProfile === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {STORAGE_PROFILES[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div>
            <div className="text-slate-500">Multithreading</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
              /MT:{profile.mt}
            </div>
          </div>
          <div>
            <div className="text-slate-500">I/O sem Buffer</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              {profile.useJ ? '/J (Ativo)' : 'Desativado'}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Modo Backup</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              {profile.useB ? '/B (Ativo)' : 'Desativado'}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Tolerância NAS</div>
            <div className="font-mono font-semibold text-slate-900 mt-0.5">
              {profile.useFft ? '/FFT (2s)' : 'NTFS Exato'}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{profile.notes}</p>
      </section>

      {/* Operational Execution Toggles: Dry-run (/L) and No Progress (/NP) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span>02. Modo Simulação · Dry-run</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <code className="font-mono text-xs text-blue-700">/L</code>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lista no log exatamente quais arquivos seriam copiados, ignorados ou removidos pelo <code className="font-mono text-slate-800">/MIR</code>, sem alterar nada no disco de destino.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {config.flags.dryRun ? 'Simulação ativa (sem gravação)' : 'Cópia efetiva em disco'}
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    flags: { ...config.flags, dryRun: false },
                  })
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !config.flags.dryRun
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Execução Real
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    flags: { ...config.flags, dryRun: true },
                  })
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  config.flags.dryRun
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Simulação (/L)
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span>03. Ocultar Progresso · No Progress</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <code className="font-mono text-xs text-blue-700">/NP</code>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Oculta o percentual de cópia (0%..100%) no terminal e no log, reduzindo drasticamente o tamanho de <code className="font-mono text-slate-800">backup_full_*.log</code> em execuções via Agendador de Tarefas.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {config.flags.np
                ? 'Logs compactos sem percentual'
                : 'Exibindo progresso percentual'}
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    flags: { ...config.flags, np: false },
                  })
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !config.flags.np
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exibir %
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    flags: { ...config.flags, np: true },
                  })
                }
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  config.flags.np
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ocultar % (/NP)
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* 04. File and Directory Exclusions (/XF and /XD) */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <span>04. Exclusões de Arquivos e Pastas</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <code className="font-mono text-xs text-blue-700">/XF</code>
              <span className="text-slate-300" aria-hidden="true">/</span>
              <code className="font-mono text-xs text-blue-700">/XD</code>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Informe extensões, nomes de arquivos ou pastas separados por vírgula. Extensões e arquivos geram flags <code className="font-mono text-slate-700">/XF</code>; diretórios geram flags <code className="font-mono text-slate-700">/XD</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => appendExclusionPreset(['*.tmp', '*.bak', '~$*'])}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              + Temporários
            </button>
            <button
              type="button"
              onClick={() =>
                appendExclusionPreset([
                  'Thumbs.db',
                  '$RECYCLE.BIN',
                  'System Volume Information',
                ])
              }
              className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              + Sistema Windows
            </button>
            <button
              type="button"
              onClick={() => appendExclusionPreset(['node_modules', '.git', '.cache'])}
              className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              + Dev / Cache
            </button>
            {config.exclusions.trim() && (
              <button
                type="button"
                onClick={() => onChange({ ...config, exclusions: '' })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="input-exclusions"
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            Extensões, arquivos ou pastas para ignorar
          </label>
          <input
            id="input-exclusions"
            type="text"
            value={config.exclusions}
            onChange={(e) => onChange({ ...config, exclusions: e.target.value })}
            placeholder="Ex: *.tmp, *.bak, Thumbs.db, node_modules, .git, System Volume Information"
            className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div>
            <div className="text-slate-500 flex items-center justify-between">
              <span>Flags de Arquivos (/XF)</span>
              <span className="font-mono tabular-nums text-slate-400">
                {parsedExclusions.xf.length}
              </span>
            </div>
            <div className="mt-1.5 font-mono text-[11.5px] text-slate-900 break-all leading-relaxed">
              {parsedExclusions.xf.length > 0 ? (
                parsedExclusions.xf
                  .map((item) => `/XF ${/\s/.test(item) ? `"${item}"` : item}`)
                  .join(' ')
              ) : (
                <span className="text-slate-400 font-sans">
                  Nenhuma exclusão de arquivo definida
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-slate-500 flex items-center justify-between">
              <span>Flags de Diretórios (/XD)</span>
              <span className="font-mono tabular-nums text-slate-400">
                {parsedExclusions.xd.length}
              </span>
            </div>
            <div className="mt-1.5 font-mono text-[11.5px] text-slate-900 break-all leading-relaxed">
              {parsedExclusions.xd.length > 0 ? (
                parsedExclusions.xd
                  .map((item) => `/XD ${/\s/.test(item) ? `"${item}"` : item}`)
                  .join(' ')
              ) : (
                <span className="text-slate-400 font-sans">
                  Nenhuma exclusão de diretório definida
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === cat.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar flag ou função (ex: /J, ACL)..."
              aria-label="Buscar flag do Robocopy"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-900">
              Nenhuma flag encontrada para os filtros aplicados.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setQuery('');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4 whitespace-nowrap">Flag</th>
                  <th className="py-3 px-4">Função e Impacto</th>
                  <th className="py-3 px-4 whitespace-nowrap">Categoria</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">No Script Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filtered.map((item) => {
                  const active = isFlagActive(item.id);
                  const displayFlag =
                    item.id === 'mtEnabled'
                      ? `/MT:${config.flags.mtThreads}`
                      : item.id === 'retries'
                      ? `/R:${config.retries}`
                      : item.id === 'wait'
                      ? `/W:${config.waitSeconds}`
                      : item.flag;

                  const toggleable = item.id !== 'retries' && item.id !== 'wait';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <code className="font-mono font-semibold text-blue-700">
                          {displayFlag}
                        </code>
                      </td>
                      <td className="py-3.5 px-4 align-top space-y-1 max-w-2xl">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <p className="text-slate-600 leading-relaxed">{item.summary}</p>
                        <p className="text-slate-500 leading-relaxed">{item.detail}</p>
                        {item.caution && (
                          <p className="text-amber-700 flex items-start gap-1.5 pt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{item.caution}</span>
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-slate-600">
                        {item.categoryLabel}
                      </td>
                      <td className="py-3.5 px-4 align-top whitespace-nowrap text-right">
                        {toggleable ? (
                          <button
                            type="button"
                            onClick={() => toggleFlag(item.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                              active
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${
                                active ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            />
                            <span>{active ? 'Ativa' : 'Inativa'}</span>
                          </button>
                        ) : (
                          <span className="font-mono text-slate-700 tabular-nums">
                            Ativa ({displayFlag})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
