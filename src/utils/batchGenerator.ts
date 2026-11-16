import { BackupConfig, RobocopyExitBit, RobocopyFlagSpec } from '../types/backup';

export const DEFAULT_BACKUP_CONFIG: BackupConfig = {
  origem: '\\\\SERVIDOR-ORIGEM\\Compartilhamento',
  destinoDrive: 'D:',
  destinoPasta: '%DESTINO_DRIVE%\\Backup_Full',
  logDir: 'C:\\Scripts\\Logs',
  scriptDir: 'C:\\Scripts',
  scriptName: 'backup_arvore.bat',
  scheduledMode: true,
  retries: 3,
  waitSeconds: 5,
  exclusions: '',
  flags: {
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
};

export const ROBOCOPY_FLAGS_CATALOG: RobocopyFlagSpec[] = [
  {
    id: 'mir',
    flag: '/MIR',
    name: 'Espelhamento Inteligente',
    category: 'mirror',
    categoryLabel: 'Espelhamento',
    summary: 'Mantém o destino sincronizado com a origem, transferindo apenas arquivos novos ou alterados.',
    detail:
      'Equivale a /E /PURGE. Copia toda a árvore de diretórios (incluindo pastas vazias) e remove no destino os arquivos que foram excluídos na origem.',
    caution:
      'Atenção: arquivos apagados acidentalmente na origem também serão removidos no destino na execução seguinte.',
  },
  {
    id: 'copyAll',
    flag: '/COPYALL',
    name: 'Preservação Total de Metadados',
    category: 'metadata',
    categoryLabel: 'Metadados NTFS',
    summary: 'Copia Dados, Atributos, Timestamps, ACLs NTFS, Proprietário e Auditoria (/COPY:DATSOU).',
    detail:
      'Garante fidelidade jurídica e operacional de permissões de rede (ACLs) caso seja necessário restaurar o servidor inteiro.',
    caution: 'Requer privilégios administrativos ou Modo Backup (/B) para gravar proprietários e auditoria.',
  },
  {
    id: 'dcopyDat',
    flag: '/DCOPY:DAT',
    name: 'Metadados de Diretórios',
    category: 'metadata',
    categoryLabel: 'Metadados NTFS',
    summary: 'Preserva Dados, Atributos e Timestamps originais das pastas.',
    detail:
      'Sem esta flag, o Windows Server atualiza a data de criação/modificação das pastas recriadas para a data da execução do backup.',
  },
  {
    id: 'backupMode',
    flag: '/B',
    name: 'Modo Backup (SeBackupPrivilege)',
    category: 'performance',
    categoryLabel: 'Performance & I/O',
    summary: 'Utiliza o privilégio de backup do Windows, reduzindo sobrecarga em redes locais cabeadas.',
    detail:
      'Permite copiar arquivos ignorando bloqueios restritivos de ACL quando executado com conta elevada, evitando falhas de acesso negado em pastas departamentais.',
    caution: 'Exige "Executar com privilégios mais altos" no Agendador de Tarefas.',
  },
  {
    id: 'unbuffered',
    flag: '/J',
    name: 'Unbuffered I/O',
    category: 'performance',
    categoryLabel: 'Performance & I/O',
    summary: 'I/O sem buffer no cache do sistema, ideal para arquivos grandes sem saturar a RAM.',
    detail:
      'Impede que arquivos de dezenas de gigabytes (VMs, bancos, ISOs) consumam toda a memória cache do Windows Server 2012+ durante a cópia.',
  },
  {
    id: 'mtEnabled',
    flag: '/MT:16',
    name: 'Multithreading Calibrado',
    category: 'performance',
    categoryLabel: 'Performance & I/O',
    summary: 'Processa múltiplos arquivos simultaneamente; 16 threads evitam gargalos em HDs externos USB.',
    detail:
      'O padrão sem /MT usa 8 threads. Valores entre 8 e 16 maximizam vazão SMB sem provocar thrashing mecânico em discos externos USB 3.0.',
    caution: 'Valores acima de 32 threads podem degradar HDs externos USB devido à contenção de fila I/O.',
  },
  {
    id: 'fft',
    flag: '/FFT',
    name: 'Tolerância de Timestamp FAT/NAS',
    category: 'safety',
    categoryLabel: 'Prevenção de Falhas',
    summary: 'Adota granularidade de 2 segundos nos carimbos de tempo entre origem e destino.',
    detail:
      'Evita recópias completas desnecessárias quando a origem está em NAS Linux/Samba ou volumes com diferenças mínimas de precisão de relógio.',
  },
  {
    id: 'xj',
    flag: '/XJ',
    name: 'Exclusão de Junction Points',
    category: 'safety',
    categoryLabel: 'Prevenção de Falhas',
    summary: 'Ignora junções simbólicas de diretórios e arquivos, prevenindo loops infinitos.',
    detail:
      'Protege contra recursão infinita em pastas do sistema ou perfis de usuário (ex.: Application Data -> AppData) que estouram o limite de caminho.',
  },
  {
    id: 'dryRun',
    flag: '/L',
    name: 'Modo Simulação (Dry-run)',
    category: 'safety',
    categoryLabel: 'Prevenção de Falhas',
    summary: 'Simula a execução listando arquivos que seriam copiados ou excluídos, sem alterar nada no disco.',
    detail:
      'Permite auditar o comportamento do espelhamento (/MIR) e validar caminhos SMB antes da primeira execução em ambiente de produção.',
    caution:
      'Desative o modo Dry-run (/L) após validar o log de simulação para que o backup passe a gravar arquivos em produção.',
  },
  {
    id: 'np',
    flag: '/NP',
    name: 'Sem Porcentagem de Progresso',
    category: 'logging',
    categoryLabel: 'Logs & Retentativas',
    summary: 'Omite marcadores de 0%..100% no arquivo de log.',
    detail:
      'Mantém os arquivos backup_full_AAAAMMDD_HHMM.log compactos, legíveis e auditáveis sem milhares de linhas de progresso.',
  },
  {
    id: 'tee',
    flag: '/TEE',
    name: 'Saída Dupla (Console + Log)',
    category: 'logging',
    categoryLabel: 'Logs & Retentativas',
    summary: 'Exibe a saída simultaneamente na tela e no arquivo de log.',
    detail:
      'Útil durante testes manuais interativos; em tarefas agendadas em segundo plano pode permanecer desativado.',
  },
  {
    id: 'retries',
    flag: '/R:3',
    name: 'Tentativas por Arquivo',
    category: 'logging',
    categoryLabel: 'Logs & Retentativas',
    summary: 'Define quantas vezes o Robocopy tenta copiar um arquivo bloqueado antes de falhar.',
    detail:
      'O padrão nativo do Robocopy é 1.000.000 de tentativas — o que travaria o backup por dias. Configurar /R:3 garante conclusão previsível.',
  },
  {
    id: 'wait',
    flag: '/W:5',
    name: 'Intervalo Entre Retentativas',
    category: 'logging',
    categoryLabel: 'Logs & Retentativas',
    summary: 'Tempo de espera em segundos entre cada nova tentativa definida em /R.',
    detail:
      'Evita espera excessiva (padrão nativo é 30s) mantendo tolerância para micro-oscilações de rede SMB ou travas momentâneas.',
  },
];

export const EXIT_CODE_BITS: RobocopyExitBit[] = [
  {
    value: 0,
    hex: '0x00',
    label: 'Nenhuma alteração detectada',
    description: 'Origem e destino já estavam idênticos. Nenhum arquivo copiado ou removido.',
    isError: false,
  },
  {
    value: 1,
    hex: '0x01',
    label: 'Arquivos copiados com sucesso',
    description: 'Um ou mais arquivos novos ou atualizados foram transferidos para o destino.',
    isError: false,
  },
  {
    value: 2,
    hex: '0x02',
    label: 'Arquivos/pastas extras detectados',
    description: 'Itens extras existiam no destino (removidos quando /MIR está ativo).',
    isError: false,
  },
  {
    value: 4,
    hex: '0x04',
    label: 'Incompatibilidades encontradas',
    description: 'Arquivos ou pastas com nomes conflitantes entre arquivo e diretório.',
    isError: false,
  },
  {
    value: 8,
    hex: '0x08',
    label: 'Falhas de cópia após retentativas',
    description: 'Alguns arquivos ou diretórios não puderam ser copiados após exceder /R e /W.',
    isError: true,
  },
  {
    value: 16,
    hex: '0x10',
    label: 'Erro fatal de execução',
    description: 'Caminho inacessível, disco desconectado, permissão negada ou sintaxe inválida.',
    isError: true,
  },
];

export function decodeErrorLevel(code: number): {
  code: number;
  isCritical: boolean;
  activeBits: RobocopyExitBit[];
  logTarget: 'historico_execucoes.log' | 'erros_backup.log';
  summary: string;
} {
  const clamped = Math.max(0, Math.min(31, Math.floor(code || 0)));
  const activeBits =
    clamped === 0
      ? [EXIT_CODE_BITS[0]]
      : EXIT_CODE_BITS.filter((bit) => bit.value > 0 && (clamped & bit.value) !== 0);

  const isCritical = clamped >= 8;
  return {
    code: clamped,
    isCritical,
    activeBits,
    logTarget: isCritical ? 'erros_backup.log' : 'historico_execucoes.log',
    summary: isCritical
      ? `Código ${clamped} (>= 8): Falha crítica detectada. O script registra em erros_backup.log e retorna código ${clamped} ao Agendador de Tarefas.`
      : `Código ${clamped} (< 8): Execução bem-sucedida. O script registra em historico_execucoes.log e retorna código 0 ao Agendador.`,
  };
}

export function extractServerFromUnc(uncPath: string): string {
  const cleaned = uncPath.trim().replace(/^\\\\/, '');
  const firstPart = cleaned.split('\\')[0];
  return firstPart || 'SERVIDOR-ORIGEM';
}

const KNOWN_DOT_DIRS = new Set([
  '.git',
  '.svn',
  '.hg',
  '.bzr',
  '.vscode',
  '.idea',
  '.cache',
  '.venv',
  '.env.d',
  '.next',
  '.nuxt',
  '.turbo',
  '.yarn',
]);

const KNOWN_DIR_NAMES = new Set([
  'node_modules',
  'vendor',
  'dist',
  'build',
  'temp',
  'tmp',
  'cache',
  'logs',
  '$recycle.bin',
  'system volume information',
  'recycler',
  '__pycache__',
]);

function formatExclusionArg(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

export function parseExclusionPatterns(rawInput: string): {
  xf: string[];
  xd: string[];
  flagsTokens: string[];
} {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return { xf: [], xd: [], flagsTokens: [] };
  }

  let rawTokens: string[];
  if (/[,\n;]/.test(trimmed)) {
    rawTokens = trimmed
      .split(/[,\n;]+/)
      .map((item) => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  } else {
    const matches = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
    rawTokens = matches
      .map((item) => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }

  const xfSet = new Set<string>();
  const xdSet = new Set<string>();

  for (const rawToken of rawTokens) {
    const token = rawToken.replace(/[\\/]+$/, '');
    if (!token) continue;

    const lower = token.toLowerCase();
    const hadTrailingSlash = /[\\/]$/.test(rawToken);

    if (hadTrailingSlash || KNOWN_DOT_DIRS.has(lower) || KNOWN_DIR_NAMES.has(lower)) {
      xdSet.add(token);
      continue;
    }

    // Wildcards like *.tmp, *.bak, ~$* are file patterns -> /XF
    if (/[*?]/.test(token)) {
      xfSet.add(token);
      continue;
    }

    // Shorthand extension like .tmp or .bak -> normalize to *.tmp for Robocopy /XF
    if (/^\.[a-z0-9]{1,10}$/i.test(token) && lower !== '.ds_store') {
      xfSet.add(`*${token}`);
      continue;
    }

    // Explicit file names with extension (e.g. Thumbs.db, desktop.ini, .DS_Store)
    const baseName = token.split(/[\\/]/).pop() || token;
    if (/\.[a-z0-9_-]{1,12}$/i.test(baseName)) {
      xfSet.add(token);
      continue;
    }

    // Everything else (folder names, UNC/local dir paths, System Volume Information) -> /XD
    xdSet.add(token);
  }

  const xf = Array.from(xfSet);
  const xd = Array.from(xdSet);
  const flagsTokens = [
    ...xf.map((item) => `/XF ${formatExclusionArg(item)}`),
    ...xd.map((item) => `/XD ${formatExclusionArg(item)}`),
  ];

  return { xf, xd, flagsTokens };
}

export function generateRobocopyFlagsLine(config: BackupConfig): string {
  const tokens: string[] = [];
  if (config.flags.mir) tokens.push('/MIR');
  if (config.flags.copyAll) tokens.push('/COPYALL');
  if (config.flags.dcopyDat) tokens.push('/DCOPY:DAT');
  if (config.flags.backupMode) tokens.push('/B');
  if (config.flags.unbuffered) tokens.push('/J');
  if (config.flags.mtEnabled) tokens.push(`/MT:${config.flags.mtThreads}`);
  if (config.flags.fft) tokens.push('/FFT');
  if (config.flags.xj) tokens.push('/XJ');
  tokens.push(`/R:${config.retries}`);
  tokens.push(`/W:${config.waitSeconds}`);
  if (config.flags.np) tokens.push('/NP');
  if (config.flags.tee) tokens.push('/TEE');
  if (config.flags.dryRun) tokens.push('/L');

  const { flagsTokens } = parseExclusionPatterns(config.exclusions);
  tokens.push(...flagsTokens);

  return tokens.join(' ');
}

export function generateBatchScript(config: BackupConfig): string {
  const flagsLine = generateRobocopyFlagsLine(config);
  const pauseLine = config.scheduledMode
    ? ':: pause  (Desativado para execucao automatizada em segundo plano)'
    : 'pause';

  return `@echo off
setlocal EnableExtensions EnableDelayedExpansion

:: ============================================================================
:: Backup Espelhado Automatizado - Windows Server 2012+ (Robocopy)
:: Script: ${config.scriptName}
:: ============================================================================

:: --- Configuracao de Variaveis de Ambiente ---
set "ORIGEM=${config.origem}"
set "DESTINO_DRIVE=${config.destinoDrive}"
set "DESTINO_PASTA=${config.destinoPasta}"
set "LOG_DIR=${config.logDir}"

:: --- Geracao de Timestamp Padronizado (AAAAMMDD_HHMM) ---
set "TIMESTAMP="
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do (
    set "DT=%%I"
)
if defined DT (
    set "TIMESTAMP=!DT:~0,8!_!DT:~8,4!"
) else (
    for /f "usebackq delims=" %%T in (\`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmm'"\`) do set "TIMESTAMP=%%T"
)

set "LOG_EXEC=%LOG_DIR%\\backup_full_%TIMESTAMP%.log"
set "LOG_HIST=%LOG_DIR%\\historico_execucoes.log"
set "LOG_ERRO=%LOG_DIR%\\erros_backup.log"

:: --- Garante a existencia do diretorio de logs ---
if not exist "%LOG_DIR%" (
    mkdir "%LOG_DIR%" >nul 2>&1
)

:: --- Validacao 1: Unidade externa de destino conectada ---
if not exist "%DESTINO_DRIVE%\\" (
    echo [%DATE% %TIME%] ERRO CRITICO: Unidade de destino %DESTINO_DRIVE% desconectada ou inacessivel. >> "%LOG_ERRO%"
    echo ERRO: Unidade %DESTINO_DRIVE% nao encontrada.
    ${pauseLine}
    endlocal & exit /b 16
)

:: --- Validacao 2: Compartilhamento SMB de origem acessivel ---
if not exist "%ORIGEM%" (
    echo [%DATE% %TIME%] ERRO CRITICO: Origem de rede %ORIGEM% inacessivel. Verifique rede/SMB/cmdkey. >> "%LOG_ERRO%"
    echo ERRO: Compartilhamento %ORIGEM% inacessivel.
    ${pauseLine}
    endlocal & exit /b 16
)

:: --- Garante a existencia da pasta de destino ---
if not exist "%DESTINO_PASTA%" (
    mkdir "%DESTINO_PASTA%" >nul 2>&1
)

:: --- Execucao do Robocopy ---
${
  config.flags.dryRun
    ? 'echo [%DATE% %TIME%] [MODO SIMULACAO /L] Nenhum arquivo sera copiado, alterado ou excluido.'
    : 'echo [%DATE% %TIME%] Iniciando backup de "%ORIGEM%" para "%DESTINO_PASTA%"...'
}
robocopy "%ORIGEM%" "%DESTINO_PASTA%" ${flagsLine} /LOG:"%LOG_EXEC%"
set "RC=%ERRORLEVEL%"

:: --- Validacao Real de ERRORLEVEL (Robocopy: valores menores que 8 = Sucesso) ---
if %RC% GEQ 8 (
    echo [%DATE% %TIME%] FALHA ^(ERRORLEVEL=%RC%^) - Origem: %ORIGEM% -^> Destino: %DESTINO_PASTA% ^| Log: %LOG_EXEC% >> "%LOG_ERRO%"
    echo Backup finalizado com ERRO CRITICO ^(Codigo: %RC%^). Consulte %LOG_ERRO%.
    ${pauseLine}
    endlocal & exit /b %RC%
) else (
    echo [%DATE% %TIME%] SUCESSO ^(ERRORLEVEL=%RC%^) - Origem: %ORIGEM% -^> Destino: %DESTINO_PASTA% ^| Log: %LOG_EXEC% >> "%LOG_HIST%"
    echo Backup concluido com sucesso ^(Codigo Robocopy: %RC%^).
)

${pauseLine}
endlocal & exit /b 0
`;
}

export function generatePowerShellTaskCommand(
  config: BackupConfig,
  taskName: string,
  scheduleTime: string,
  accountUser: string
): string {
  const fullScriptPath = `${config.scriptDir.replace(/\\+$/, '')}\\${config.scriptName}`;
  const cleanDir = config.scriptDir.replace(/\\+$/, '');

  return `# Execute no PowerShell como Administrador para criar a tarefa automaticamente
$Action = New-ScheduledTaskAction -Execute "${fullScriptPath}" -WorkingDirectory "${cleanDir}"
$Trigger = New-ScheduledTaskTrigger -Daily -At "${scheduleTime}"
$Settings = New-ScheduledTaskSettingsSet \`
  -ExecutionTimeLimit (New-TimeSpan -Hours 12) \`
  -MultipleInstances IgnoreNew \`
  -StartWhenAvailable
$Principal = New-ScheduledTaskPrincipal -UserId "${accountUser}" -LogonType Password -RunLevel Highest

Register-ScheduledTask \`
  -TaskName "${taskName}" \`
  -Action $Action \`
  -Trigger $Trigger \`
  -Settings $Settings \`
  -Principal $Principal \`
  -Description "Backup espelhado automatizado via Robocopy (${config.origem} -> ${config.destinoPasta})"`;
}

export function downloadBatchFile(filename: string, content: string): void {
  const crlfContent = content.replace(/\r?\n/g, '\r\n');
  const blob = new Blob([crlfContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'backup_arvore.bat';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
