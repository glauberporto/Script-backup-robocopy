import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Terminal,
} from 'lucide-react';
import { BackupConfig } from '../types/backup';
import {
  extractServerFromUnc,
  generatePowerShellTaskCommand,
} from '../utils/batchGenerator';

interface SchedulerAndAuthProps {
  config: BackupConfig;
  onEnableScheduledMode: () => void;
}

type SchedulerTab = 'geral' | 'disparadores' | 'acoes' | 'configuracoes';

export const SchedulerAndAuth: React.FC<SchedulerAndAuthProps> = ({
  config,
  onEnableScheduledMode,
}) => {
  const [activeTab, setActiveTab] = useState<SchedulerTab>('geral');
  const [cmdServer, setCmdServer] = useState(() => extractServerFromUnc(config.origem));
  const [cmdUser, setCmdUser] = useState('DOMINIO\\svc_backup');
  const [cmdPass, setCmdPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [taskName, setTaskName] = useState('Backup_Arvore_Robocopy');
  const [scheduleTime, setScheduleTime] = useState('23:00');
  const [taskAccount, setTaskAccount] = useState('DOMINIO\\svc_backup');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setCmdServer(extractServerFromUnc(config.origem));
  }, [config.origem]);

  const cleanDir = config.scriptDir.replace(/\\+$/, '');
  const fullScriptPath = `${cleanDir}\\${config.scriptName}`;

  const safePass = cmdPass ? cmdPass : 'SENHA';
  const safeUser = cmdUser.trim() || 'USUARIO';
  const safeServer = cmdServer.trim() || 'SERVIDOR-ORIGEM';

  const cmdkeyAdd = `cmdkey /add:${safeServer} /user:${safeUser} /pass:${safePass}`;
  const cmdkeyList = `cmdkey /list`;
  const cmdkeyDelete = `cmdkey /delete:${safeServer}`;

  const psCommand = generatePowerShellTaskCommand(
    config,
    taskName || 'Backup_Arvore_Robocopy',
    scheduleTime || '23:00',
    taskAccount || 'DOMINIO\\svc_backup'
  );

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore if clipboard unavailable
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          Agendador de Tarefas e Autenticação SMB
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Configure a execução automática em segundo plano no Windows Server (<code className="font-mono text-slate-800">taskschd.msc</code>) e armazene credenciais SMB fora do domínio via <code className="font-mono text-slate-800">cmdkey</code>.
        </p>
      </div>

      {!config.scheduledMode && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Atenção:</span> O comando{' '}
              <code className="font-mono font-semibold">pause</code> ainda está ativo no seu script. Em tarefas agendadas em segundo plano, isso impede o término do processo.
            </div>
          </div>
          <button
            type="button"
            onClick={onEnableScheduledMode}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-900 text-white hover:bg-amber-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Comentar :: pause agora
          </button>
        </div>
      )}

      {/* Task Scheduler Interactive Guide */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              01. Configuração no Agendador de Tarefas (taskschd.msc)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Abra <code className="font-mono">taskschd.msc</code> e clique em <strong>Criar Tarefa...</strong> seguindo as 4 abas abaixo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { id: 'geral', label: 'Aba Geral' },
                { id: 'disparadores', label: 'Disparadores' },
                { id: 'acoes', label: 'Ações' },
                { id: 'configuracoes', label: 'Configurações' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-semibold text-slate-900">
                    Conta de Serviço / Administrador
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Informe uma conta de serviço ou administrador com permissão de leitura na origem SMB e escrita no disco local.
                  </p>
                  <p className="text-xs text-red-700 font-medium">
                    Evite a conta SYSTEM para caminhos de rede UNC (\\servidor\pasta), pois ela não possui contexto de credenciais SMB para servidores externos.
                  </p>
                </div>

                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="font-semibold text-slate-900">
                    Opções Obrigatórias de Segurança
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        Selecione <strong>"Executar estando o usuário conectado ou não"</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        Marque <strong>"Executar com privilégios mais altos"</strong> (necessário para o Modo Backup <code className="font-mono">/B</code> e ACLs <code className="font-mono">/COPYALL</code>)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'disparadores' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900">
                  Agendamento Recomendado
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Configure os dias e horários fora do expediente comercial (ex.: diariamente às 23:00) para minimizar concorrência de arquivos abertos por usuários.
                </p>
              </div>
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900">
                  Janela de Espelhamento Incremental
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Como o <code className="font-mono">/MIR</code> transfere apenas arquivos novos ou alterados após a primeira carga cheia, execuções diárias ou noturnas costumam concluir em minutos.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'acoes' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Preencha os campos da ação exatamente conforme os valores gerados para o seu ambiente:
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left border-collapse text-xs">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <th className="py-3 px-4 bg-slate-50 font-medium text-slate-600 w-52">
                        Ação
                      </th>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        Iniciar um programa
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 bg-slate-50 font-medium text-slate-600">
                        Programa/script
                      </th>
                      <td className="py-3 px-4 font-mono text-blue-700">
                        {fullScriptPath}
                      </td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 bg-slate-50 font-medium text-slate-600">
                        Iniciar em (opcional)
                      </th>
                      <td className="py-3 px-4 font-mono text-slate-900">
                        {cleanDir}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'configuracoes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900">
                  Tempo Máximo de Execução
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Defina o limite para interromper a tarefa conforme o volume total de dados (ex.: <strong>12 horas</strong> ou desmarque em cargas iniciais de múltiplos terabytes).
                </p>
              </div>
              <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-semibold text-slate-900">
                  Prevenção de Concorrência
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Em <strong>"Se a tarefa já estiver em execução"</strong>, selecione obrigatoriamente <strong>"Não iniciar uma nova instância"</strong> para evitar dois processos Robocopy disputando o mesmo disco.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Two columns: cmdkey builder & PowerShell automated registration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* cmdkey Vault Generator */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                02. Autenticação em Compartilhamentos Fora do Domínio (cmdkey)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Execute uma única vez no Prompt de Comando sob a mesma conta configurada no Agendador de Tarefas.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="cmd-server"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Servidor / IP
              </label>
              <input
                id="cmd-server"
                type="text"
                value={cmdServer}
                onChange={(e) => setCmdServer(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label
                htmlFor="cmd-user"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Usuário SMB
              </label>
              <input
                id="cmd-user"
                type="text"
                value={cmdUser}
                onChange={(e) => setCmdUser(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label
                htmlFor="cmd-pass"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="cmd-pass"
                  type={showPass ? 'text' : 'password'}
                  value={cmdPass}
                  onChange={(e) => setCmdPass(e.target.value)}
                  placeholder="SENHA"
                  className="w-full pl-3 pr-8 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">
                Prompt de Comando (Cofre do Windows)
              </span>
              <button
                type="button"
                onClick={() => copyText('cmdkey', cmdkeyAdd)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                {copiedId === 'cmdkey' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copiar comando</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-nowrap">
              {cmdkeyAdd}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-mono">
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <span className="text-slate-700 truncate">{cmdkeyList}</span>
              <button
                type="button"
                onClick={() => copyText('cmdlist', cmdkeyList)}
                className="text-blue-700 hover:underline shrink-0 cursor-pointer"
              >
                {copiedId === 'cmdlist' ? 'Copiado' : 'Listar'}
              </button>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <span className="text-slate-700 truncate">{cmdkeyDelete}</span>
              <button
                type="button"
                onClick={() => copyText('cmddel', cmdkeyDelete)}
                className="text-blue-700 hover:underline shrink-0 cursor-pointer"
              >
                {copiedId === 'cmddel' ? 'Copiado' : 'Remover'}
              </button>
            </div>
          </div>
        </section>

        {/* PowerShell Task Scheduler Provisioning */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-2.5">
            <Terminal className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                03. Provisionamento Rápido via PowerShell
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Opcional: crie a tarefa com todas as políticas recomendadas via PowerShell elevado.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="ps-taskname"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nome da Tarefa
              </label>
              <input
                id="ps-taskname"
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label
                htmlFor="ps-time"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Horário Diário
              </label>
              <input
                id="ps-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label
                htmlFor="ps-account"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Conta de Execução
              </label>
              <input
                id="ps-account"
                type="text"
                value={taskAccount}
                onChange={(e) => setTaskAccount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">
                PowerShell (Administrador)
              </span>
              <button
                type="button"
                onClick={() => copyText('ps-task', psCommand)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                {copiedId === 'ps-task' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copiar PowerShell</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 font-mono text-[11.5px] leading-5 text-slate-200 overflow-x-auto terminal-scroll">
              {psCommand}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};
