import React, { useState } from 'react';
import { Check, Copy, Download, FileCode2 } from 'lucide-react';
import { downloadBatchFile } from '../utils/batchGenerator';

interface BatchCodeViewerProps {
  script: string;
  filename: string;
  scriptDir: string;
  scheduledMode: boolean;
}

function renderBatchLine(line: string): React.ReactNode {
  const trimmed = line.trim();

  if (trimmed.startsWith('::') || trimmed.toLowerCase().startsWith('rem ')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }

  if (trimmed.startsWith('@echo')) {
    return <span className="text-sky-400 font-medium">{line}</span>;
  }

  if (trimmed.startsWith('robocopy ')) {
    const parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || line.split(' ');
    return (
      <>
        <span className="text-emerald-400 font-semibold">{parts[0]}</span>{' '}
        {parts.slice(1).map((token, idx) => {
          if (token.startsWith('/')) {
            return (
              <span key={idx} className="text-amber-300 font-medium">
                {token}{' '}
              </span>
            );
          }
          if (token.startsWith('"') && token.endsWith('"')) {
            return (
              <span key={idx} className="text-sky-300">
                {token}{' '}
              </span>
            );
          }
          return <span key={idx}>{token} </span>;
        })}
      </>
    );
  }

  if (trimmed.startsWith('set ')) {
    const eqIndex = line.indexOf('=');
    if (eqIndex !== -1) {
      const prefix = line.slice(0, eqIndex);
      const rest = line.slice(eqIndex);
      return (
        <>
          <span className="text-blue-400">{prefix}</span>
          <span className="text-slate-200">{rest}</span>
        </>
      );
    }
  }

  if (
    trimmed.startsWith('if ') ||
    trimmed.startsWith(') else (') ||
    trimmed.startsWith('for ') ||
    trimmed.startsWith('setlocal') ||
    trimmed.startsWith('endlocal') ||
    trimmed.startsWith('pause')
  ) {
    return <span className="text-indigo-300">{line}</span>;
  }

  return <span className="text-slate-200">{line}</span>;
}

export const BatchCodeViewer: React.FC<BatchCodeViewerProps> = ({
  script,
  filename,
  scriptDir,
  scheduledMode,
}) => {
  const [copied, setCopied] = useState(false);

  const lines = script.split('\n');
  const fullPath = `${scriptDir.replace(/\\+$/, '')}\\${filename}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script.replace(/\r?\n/g, '\r\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode2 className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-mono text-slate-100 truncate">
              {fullPath}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="tabular-nums">{lines.length} linhas</span>
              <span aria-hidden="true">·</span>
              <span>CRLF (Windows)</span>
              <span aria-hidden="true">·</span>
              <span>{scheduledMode ? 'Segundo plano' : 'Interativo'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => downloadBatchFile(filename, script)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar .bat</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[680px] overflow-y-auto terminal-scroll p-4 text-[12.5px] leading-6 font-mono">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40">
                <td className="select-none pr-4 text-right text-slate-600 tabular-nums align-top w-9">
                  {idx + 1}
                </td>
                <td className="whitespace-pre text-slate-200 align-top">
                  {line === '' ? '\u00A0' : renderBatchLine(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
