import React, { useState } from 'react';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';
import { BackupConfig } from '../types/backup';
import {
  decodeErrorLevel,
  EXIT_CODE_BITS,
  generateRobocopyFlagsLine,
} from '../utils/batchGenerator';

interface LogsAndErrorLevelProps {
  config: BackupConfig;
}

type LogFileTab = 'individual' | 'historico' | 'erros';

export const LogsAndErrorLevel: React.FC<LogsAndErrorLevelProps> = ({ config }) => {
  const [errorCode, setErrorCode] = useState<number>(3);
  const [activeLogTab, setActiveLogTab] = useState<LogFileTab>('individual');

  const decoded = decodeErrorLevel(errorCode);
  const flagsLine = generateRobocopyFlagsLine(config);
  const resolvedDest = config.destinoPasta.replace(
    /%DESTINO_DRIVE%/gi,
    config.destinoDrive
  );

  const toggleBit = (bitValue: number) => {
    if (bitValue === 0) {
      setErrorCode(0);
      return;
    }
    setErrorCode((prev) => prev ^ bitValue);
  };

  const sampleLogContent: Record<LogFileTab, { filename: string; content: string }> = {
    individual: {
      filename: `${config.logDir}\\backup_full_20261114_2300.log`,
      content: `-------------------------------------------------------------------------------
   ROBOCOPY     ::     Robust File Copy for Windows
-------------------------------------------------------------------------------

  Started : Saturday, November 14, 2026 23:00:02
   Source : ${config.origem}\\
     Dest : ${resolvedDest}\\

    Files : *.*

  Options : *.* ${flagsLine} /LOG:${config.logDir}\\backup_full_20261114_2300.log

------------------------------------------------------------------------------
${config.flags.dryRun ? '\n  *** MODO SIMULACAO (/L): Listagem apenas. Nenhuma alteracao aplicada no destino. ***\n' : ''}
                   142    ${config.origem}\\Financeiro\\
          New File             1.4 m    Balancete_2026_11.xlsx
          Newer              428.5 k    Relatorio_Fiscal.pdf
                   85     ${config.origem}\\Engenharia\\Projetos\\
         *EXTRA File         212.0 k    Rascunho_Antigo.tmp

------------------------------------------------------------------------------

               Total    Copied   Skipped  Mismatch    FAILED    Extras
    Dirs :       418         4       414         0         0         1
   Files :     18420       127     18293         0         0         3
   Bytes :  48.620 g  612.40 m  48.007 g         0         0   2.140 m
   Times :   0:01:48   0:01:32                       0:00:00   0:00:16

   Speed :           6,973,412 Bytes/sec.
   Speed :             399.021 MegaBytes/min.
   Ended : Saturday, November 14, 2026 23:01:50`,
    },
    historico: {
      filename: `${config.logDir}\\historico_execucoes.log`,
      content: `[12/11/2026 23:04:11.20] SUCESSO (ERRORLEVEL=1) - Origem: ${config.origem} -> Destino: ${resolvedDest} | Log: ${config.logDir}\\backup_full_20261112_2300.log
[13/11/2026 23:00:49.84] SUCESSO (ERRORLEVEL=0) - Origem: ${config.origem} -> Destino: ${resolvedDest} | Log: ${config.logDir}\\backup_full_20261113_2300.log
[14/11/2026 23:01:50.12] SUCESSO (ERRORLEVEL=3) - Origem: ${config.origem} -> Destino: ${resolvedDest} | Log: ${config.logDir}\\backup_full_20261114_2300.log`,
    },
    erros: {
      filename: `${config.logDir}\\erros_backup.log`,
      content: `[10/11/2026 23:00:01.05] ERRO CRITICO: Unidade de destino ${config.destinoDrive} desconectada ou inacessivel.
[11/11/2026 23:00:04.42] ERRO CRITICO: Origem de rede ${config.origem} inacessivel. Verifique rede/SMB/cmdkey.
[15/11/2026 23:18:22.90] FALHA (ERRORLEVEL=8) - Origem: ${config.origem} -> Destino: ${resolvedDest} | Log: ${config.logDir}\\backup_full_20261115_2300.log`,
    },
  };

  const activeSample = sampleLogContent[activeLogTab];

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Auditoria de Logs e Códigos ERRORLEVEL
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          O Robocopy utiliza códigos de saída bitmask onde valores menores que 8 indicam sucesso operacional. Teste combinações de bits e visualize os arquivos gerados em <code className="font-mono text-slate-800">{config.logDir}</code>.
        </p>
      </div>

      {/* ERRORLEVEL Bitmask Simulator */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              01. Analisador de Códigos de Saída (ERRORLEVEL)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Combine bits abaixo ou informe um código decimal para verificar o roteamento de log e o retorno ao Agendador de Tarefas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="errorlevel-input"
              className="text-xs font-medium text-slate-700 whitespace-nowrap"
            >
              Código Decimal:
            </label>
            <input
              id="errorlevel-input"
              type="number"
              min={0}
              max={31}
              value={decoded.code}
              onChange={(e) => setErrorCode(Math.max(0, Math.min(31, Number(e.target.value) || 0)))}
              className="w-20 px-3 py-1.5 text-sm font-mono font-semibold tabular-nums bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Bit toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EXIT_CODE_BITS.map((bit) => {
            const isSelected =
              bit.value === 0
                ? decoded.code === 0
                : (decoded.code & bit.value) !== 0;

            return (
              <button
                key={bit.value}
                type="button"
                onClick={() => toggleBit(bit.value)}
                className={`text-left p-3.5 rounded-md border transition-colors cursor-pointer ${
                  isSelected
                    ? bit.isError
                      ? 'bg-red-50 border-red-300 text-red-950'
                      : 'bg-blue-50 border-blue-300 text-slate-900'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    Bit {bit.value} ({bit.hex})
                  </span>
                  <span className="text-[11px] font-medium">
                    {bit.isError ? 'Erro (>= 8)' : 'OK (< 8)'}
                  </span>
                </div>
                <div className="text-xs font-semibold mt-1.5">{bit.label}</div>
                <p className="text-[11px] opacity-80 mt-1 leading-relaxed">
                  {bit.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Evaluation Result Banner */}
        <div
          className={`p-4 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
            decoded.isCritical
              ? 'bg-red-50 border-red-200 text-red-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {decoded.isCritical ? (
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold text-sm flex flex-wrap items-center gap-2">
                <span>
                  {decoded.isCritical ? 'Falha Crítica Detectada' : 'Execução Bem-Sucedida'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  ERRORLEVEL = {decoded.code}
                </span>
              </div>
              <p className="leading-relaxed opacity-90">{decoded.summary}</p>
            </div>
          </div>

          <div className="shrink-0 font-mono text-xs bg-white/80 border border-black/10 px-3 py-2 rounded">
            Destino: {decoded.logTarget}
          </div>
        </div>
      </section>

      {/* Log Directory Structure Preview */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              02. Estrutura de Logs Gerados
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Todos os arquivos abaixo são mantidos automaticamente no diretório configurado em{' '}
              <code className="font-mono text-slate-700">LOG_DIR</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveLogTab('individual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeLogTab === 'individual'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              backup_full_AAAAMMDD_HHMM.log
            </button>
            <button
              type="button"
              onClick={() => setActiveLogTab('historico')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeLogTab === 'historico'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              historico_execucoes.log
            </button>
            <button
              type="button"
              onClick={() => setActiveLogTab('erros')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeLogTab === 'erros'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              erros_backup.log
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
              <div className="font-mono font-semibold text-slate-900">
                backup_full_AAAAMMDD_HHMM.log
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Log detalhado de cada execução individual com totais de pastas, arquivos, bytes e velocidade.
              </p>
            </div>
            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
              <div className="font-mono font-semibold text-slate-900">
                historico_execucoes.log
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Resumo cronológico consolidado de todas as execuções concluídas com ERRORLEVEL menor que 8.
              </p>
            </div>
            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
              <div className="font-mono font-semibold text-slate-900">
                erros_backup.log
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Registro dedicado a unidade desconectada, compartilhamento inacessível ou código maior ou igual a 8.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-mono text-slate-200 truncate">
                {activeSample.filename}
              </span>
            </div>
            <pre className="p-4 text-[12px] leading-5 font-mono text-slate-200 overflow-x-auto terminal-scroll">
              {activeSample.content}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
