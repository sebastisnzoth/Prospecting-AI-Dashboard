import React, { useState } from "react";
import { 
  Database, 
  Terminal, 
  Globe, 
  Copy, 
  Check, 
  Bot, 
  Send, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Compass, 
  Smartphone, 
  ChevronRight,
  Info
} from "lucide-react";
import { Service, IGAccount, Campaign } from "../types";

interface WebhookAndDbViewProps {
  services: Service[];
  campaigns: Campaign[];
  accounts: IGAccount[];
  webhookLogs: any[];
  supabaseConfig: {
    url: string;
    hasApiKey: boolean;
    status: "connected_real" | "sandbox_fallback";
    region: string;
    engine: string;
    syncEnabled: boolean;
  };
  onFireWebhook: (igHandle: string, message: string, campId: string, accId: string) => Promise<void>;
  onClearLogs: () => Promise<void>;
  simulating: boolean;
  onGoToCRMContact: (contact: any) => void;
  triggerNotification: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function WebhookAndDbView({
  services,
  campaigns,
  accounts,
  webhookLogs,
  supabaseConfig,
  onFireWebhook,
  onClearLogs,
  simulating,
  onGoToCRMContact,
  triggerNotification
}: WebhookAndDbViewProps) {
  // Simulator local form inputs
  const [handleInput, setHandleInput] = useState<string>("@pizzeria_pachino");
  const [selectedCampId, setSelectedCampId] = useState<string>(campaigns[0]?.id || "");
  const [selectedAccId, setSelectedAccId] = useState<string>(accounts[0]?.id || "");
  const [messageInput, setMessageInput] = useState<string>("¡Hola! Vi su publicación de outreach automático, ¿qué precio tiene el servicio?");
  
  // Selected log item to inspect
  const [inspectLog, setInspectLog] = useState<any | null>(null);

  // SQL code toggle section
  const [showSQL, setShowSQL] = useState<boolean>(false);
  const [copiedSQL, setCopiedSQL] = useState<boolean>(false);

  // Supabase migration/sync local states
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSyncResult(data);
        triggerNotification(data.message, "success");
      } else {
        triggerNotification(data.message || "Fallo en la sincronización con Supabase.", "error");
      }
    } catch (error) {
      triggerNotification("Error de red intentando conectar con el servidor local", "error");
    } finally {
      setSyncing(false);
    }
  };

  // Pre-formatted SQL schema string matching Supabase documentation in manual
  const supabaseSQLCode = `-- ─────────────────────────────────────────────────────────────
-- SISTEMA DE PROSPECCIÓN AUTOMATIZADA CON IA (SUPABASE DDL COMPLETO)
-- ─────────────────────────────────────────────────────────────

-- 1. Catálogo de Servicios
CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ai_prompt TEXT NOT NULL,
  calendar_url VARCHAR(255) NOT NULL,
  avatar TEXT,
  color VARCHAR(50) DEFAULT '#00C8F0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cuentas Satélites de Instagram
CREATE TABLE IF NOT EXISTS ig_accounts (
  id VARCHAR(100) PRIMARY KEY,
  handle VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'active', -- active | limited | banned
  daily_limit INT DEFAULT 80,
  sent_today INT DEFAULT 0,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Campañas de Outreach
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  service_id VARCHAR(100) REFERENCES services(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'paused', -- running | paused | stopped
  messages_sent INT DEFAULT 0,
  replies INT DEFAULT 0,
  qualified INT DEFAULT 0,
  scheduled INT DEFAULT 0,
  initial_message TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  last_active VARCHAR(100) DEFAULT 'Justo ahora'
);

-- 4. Tabla de Unión Campañas <-> Cuentas Satélite
CREATE TABLE IF NOT EXISTS campaign_accounts (
  campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE CASCADE,
  account_id VARCHAR(100) REFERENCES ig_accounts(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, account_id)
);

-- 5. CRM de Contactos y Estado Conversacional
CREATE TABLE IF NOT EXISTS contacts (
  id VARCHAR(100) PRIMARY KEY,
  ig_handle VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'new', -- new | contacted | qualified | scheduled | closed | lost
  conv_stage VARCHAR(50) DEFAULT 'intro', -- intro | q1 | q2 | q3 | closing | done | lost
  conv_answers JSONB DEFAULT '{}'::jsonb,
  conv_summary TEXT,
  objections TEXT[] DEFAULT '{}',
  appointment_at TIMESTAMP WITH TIME ZONE,
  service_id VARCHAR(100) REFERENCES services(id) ON DELETE SET NULL,
  campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_handle_service UNIQUE(ig_handle, service_id)
);

-- 6. Métricas Diarias para Reportes de Control
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id VARCHAR(100) REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  sent INT DEFAULT 0,
  replies INT DEFAULT 0,
  qualified INT DEFAULT 0,
  scheduled INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  CONSTRAINT unique_campaign_date_stat UNIQUE(campaign_id, date)
);

-- 7. Registro de Eventos Raw de Webhook
CREATE TABLE IF NOT EXISTS webhook_events (
  id VARCHAR(100) PRIMARY KEY,
  ig_handle VARCHAR(100),
  message TEXT,
  account_id VARCHAR(100),
  campaign_id VARCHAR(100),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'processed',
  error TEXT,
  api_response JSONB
);

-- 8. Función para reset automático de límites diarios
CREATE OR REPLACE FUNCTION reset_daily_sent()
RETURNS void AS $$
BEGIN
  UPDATE ig_accounts
  SET sent_today = 0,
      reset_at = NOW();
END;
$$ LANGUAGE plpgsql;`;

  const copySQLToClipboard = () => {
    navigator.clipboard.writeText(supabaseSQLCode);
    setCopiedSQL(true);
    triggerNotification("¡Esquema SQL copiado al portapapeles!", "success");
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  // Preset Simulated message bodies
  const messagePresets = [
    {
      label: "Preguntar Precios",
      text: "¡Hola! Vi su publicación. Me interesa cotizar, ¿cuáles son los precios?"
    },
    {
      label: "Mencionar Empleados",
      text: "Somos un equipo pequeño, actualmente trabajamos unas 5 personas en la clínica."
    },
    {
      label: "Mudar Objeción",
      text: "Se oye espectacular, pero de momento nos da miedo que el bot responda cosas inadecuadas."
    },
    {
      label: "Reservar Cita",
      text: "Perfecto, me sirve charlar el lunes a las 11:30 am si tienen algún cupo."
    }
  ];

  return (
    <div className="p-6 space-y-6 animate-slide-up bg-[#080c14] h-full overflow-y-auto">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2d44]/50 pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Terminal className="text-purple-400 stroke-[2.2]" size={24} />
            Consola Webhook & Supabase
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Mapea la Edge Function <code className="text-purple-300 font-mono text-xs">handle-dm</code> y sincroniza la base de datos remota de São Paulo.
          </p>
        </div>

        {/* Supabase Sync Active pill badge */}
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border ${
          supabaseConfig.status === "connected_real" 
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
            : "bg-[#142036] border-[#1e2d44] text-amber-400"
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            supabaseConfig.status === "connected_real" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
          }`} />
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider">
            {supabaseConfig.status === "connected_real" ? "Supabase Conectado" : "Sandbox de Simulación"}
          </span>
        </div>
      </div>

      {/* Grid containing Simulator, Supabase Setup diagnostics and Raw Terminal logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Column: Config & Simulator */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SUPABASE STATUS DIAL */}
          <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Database size={15} className="text-cyan-400" />
                Diagnóstico de Base de Datos
              </h3>
              <span className="text-[10px] uppercase font-mono font-bold bg-[#142036] text-slate-400 px-2.5 py-0.5 rounded border border-[#1e2d44]">
                {supabaseConfig.region}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="bg-[#080c14] border border-[#1e2d44]/75 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block uppercase font-medium">Estado Canónico:</span>
                <span className="text-xs text-slate-200 block font-semibold">
                  {supabaseConfig.status === "connected_real" 
                    ? "✓ Sincronizado en Producción" 
                    : "Simulador de Alta Precisión activo"}
                </span>
              </div>
              <div className="bg-[#080c14] border border-[#1e2d44]/75 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block uppercase font-medium">Instancia Remota:</span>
                <span className="text-xs text-slate-200 block font-mono truncate" title={supabaseConfig.url}>
                  {supabaseConfig.url}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed bg-[#142036]/40 p-3.5 border border-[#1e2d44] rounded-xl flex items-start gap-2.5">
              <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Para conectar tu base de datos cloud física en São Paulo, declara <code className="text-cyan-300 font-mono select-all">SUPABASE_URL</code> y <code className="text-cyan-300 font-mono select-all">SUPABASE_ANON_KEY</code> en tu archivo <code className="text-slate-300">.env</code> del servidor. De lo contrario, se usa el sandbox persistente en <code className="text-slate-350">data-store.json</code>.
              </span>
            </div>

            {/* Collapsed SQL setup code instruction */}
            <div className="border border-[#1e2d44] rounded-xl overflow-hidden bg-[#080c14]/50">
              <button 
                onClick={() => setShowSQL(!showSQL)}
                className="w-full flex items-center justify-between p-3.5 text-xs text-slate-300 font-semibold hover:bg-[#142036]/20 transition-colors"
              >
                <span>Esquemas de Base de Datos (SQL DDL para Supabase)</span>
                <span className="text-cyan-400 text-[10px] font-mono uppercase">{showSQL ? "Ocultar" : "Mostrar código"}</span>
              </button>

              {showSQL && (
                <div className="border-t border-[#1e2d44] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">Ejecutar estos comandos en el SQL Editor de Supabase</span>
                    <button 
                      onClick={copySQLToClipboard}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] bg-[#142036] hover:bg-[#1e2d44] text-slate-300 rounded font-mono transition"
                    >
                      {copiedSQL ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copiedSQL ? "Copiado" : "Copiar SQL"}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#0c1220] rounded-lg text-[9.5px] font-mono text-cyan-400/90 leading-relaxed overflow-x-auto max-h-56">
                    {supabaseSQLCode}
                  </pre>
                </div>
              )}
            </div>

            {/* Sincronización de Datos (Local ⇄ Cloud) */}
            <div className="bg-[#142036]/40 border border-[#1e2d44]/70 rounded-xl p-4 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5 font-display">
                  <Activity size={13} className="text-emerald-400 stroke-[2.2]" />
                  Migración de Datos (Local ⇄ Supabase Cloud)
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-extrabold uppercase">PRO ENGINE</span>
              </div>
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
                Empuja las campañas, prospectos del CRM, servicios y estadísticas de tu sandbox local (<code className="text-slate-300">data-store.json</code>) directamente a las tablas de producción remota de tu proyecto Supabase.
              </p>
              
              <button
                onClick={handleSyncToSupabase}
                disabled={syncing || supabaseConfig.status !== "connected_real"}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold font-display flex items-center justify-center gap-1.5 transition-all duration-300 ${
                  supabaseConfig.status === "connected_real"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
                    : "bg-[#101420] text-slate-600 border border-slate-800/60 cursor-not-allowed"
                }`}
              >
                {syncing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Migrando datos a Supabase...
                  </>
                ) : (
                  <>
                    <Database size={13} />
                    {supabaseConfig.status === "connected_real" 
                      ? "Exportar Datos Locales a Supabase" 
                      : "Migración Deshabilitada (Faltan variables .env)"}
                  </>
                )}
              </button>

              {syncResult && (
                <div className="bg-[#080c14] border border-emerald-500/20 p-3.5 rounded-xl space-y-2 text-[10.5px] font-mono text-emerald-400 animate-slide-up">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle size={12} />
                    {syncResult.message}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400 text-[10px] pl-1.5 border-l border-emerald-500/30">
                    {syncResult.summary?.services !== undefined && <span>Servicios: {syncResult.summary.services}</span>}
                    {syncResult.summary?.campaigns !== undefined && <span>Campañas: {syncResult.summary.campaigns}</span>}
                    {syncResult.summary?.ig_accounts !== undefined && <span>Cuentas Satélite: {syncResult.summary.ig_accounts}</span>}
                    {syncResult.summary?.contacts !== undefined && <span>Prospectos CRM: {syncResult.summary.contacts}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* WEBHOOK SIMULATOR FORM (Opción B) */}
          <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                <Globe size={15} className="text-purple-400" />
                Despachar Evento Webhook (Petición Simulada de Instagram)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simula una llamada POST raw al webhook receptor de la Edge Function <code className="text-slate-300 font-mono text-[10px]">handle-dm</code>.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Handles & Accounts horizontal grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Simulated sender handles */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Handle Prospecto:</label>
                  <input 
                    type="text" 
                    value={handleInput}
                    onChange={e => setHandleInput(e.target.value)}
                    placeholder="Ej: @clinica_dental"
                    className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 text-slate-200 font-mono"
                  />
                </div>

                {/* Satellite Account Receiver */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Cuenta Satélite Destino:</label>
                  <select 
                    value={selectedAccId}
                    onChange={e => setSelectedAccId(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.handle} ({a.status})</option>
                    ))}
                  </select>
                </div>

                {/* Campaign Origin */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Campaña Asociada:</label>
                  <select 
                    value={selectedCampId}
                    onChange={e => setSelectedCampId(e.target.value)}
                    className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  >
                    <option value="">Selecciona campaña...</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Message inputs box */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Mensaje Enviado por Prospecto:</label>
                <textarea 
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  rows={3}
                  className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
                  placeholder="Ej: Hola, quiero cotizar la administración de mi cuenta de instagram..."
                />
              </div>

              {/* Quick Preset buttons */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-500 block">Mensajes Preestablecidos de Prueba:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {messagePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMessageInput(preset.text)}
                      className="px-2.5 py-1 text-[10px] font-medium text-purple-300 hover:text-white bg-purple-950/20 hover:bg-purple-950/45 border border-purple-900/30 rounded-lg transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fire/Dispatch button */}
              <button
                onClick={async () => {
                  if (!selectedCampId) {
                    triggerNotification("Selecciona una campaña para realizar la simulación.", "error");
                    return;
                  }
                  await onFireWebhook(handleInput, messageInput, selectedCampId, selectedAccId);
                }}
                disabled={simulating || campaigns.length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-display font-bold disabled:opacity-40 transition flex items-center justify-center gap-1.5 shadow-lg pt-3 pb-3"
              >
                {simulating ? <Loader2 size={13} className="animate-spin" /> : <Send size={12} />}
                Despachar Webhook Trigger (POST a handle-dm)
              </button>

            </div>
          </div>

        </div>

        {/* Right Side Column: Webhook LIVE Logs terminal (Opción B) */}
        <div className="lg:col-span-5 flex flex-col min-h-[500px]">
          
          <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl flex-1 flex flex-col overflow-hidden max-h-[700px] shadow-xl">
            
            {/* Terminal Tab Header */}
            <div className="px-4 py-3.5 border-b border-[#1e2d44] flex items-center justify-between bg-[#142036]/60">
              <div className="flex items-center gap-2">
                <Terminal className="text-emerald-400 animate-pulse" size={15} />
                <h3 className="font-mono text-xs text-slate-200 font-bold uppercase tracking-wide">Terminal logs de Edge Functions</h3>
              </div>
              <button 
                onClick={onClearLogs}
                disabled={webhookLogs.length === 0}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-mono flex items-center gap-1 disabled:opacity-30 transition"
              >
                <Trash2 size={10} /> Limpiar
              </button>
            </div>

            {/* List container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-[#1e2d44]/15">
              
              {webhookLogs.map((log) => {
                const isErr = log.status === "failed";
                const dateClean = log.timestamp ? log.timestamp.split(" ")[1] || log.timestamp : "Justo ahora";
                
                return (
                  <div 
                    key={log.id}
                    onClick={() => setInspectLog(log)}
                    className="pt-2.5 first:pt-0 cursor-pointer flex flex-col gap-1 hover:bg-[#142036]/10 p-2 rounded-lg transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          isErr ? "bg-red-500/10 text-red-400 border border-red-500/15" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                        }`}>
                          {log.status === "failed" ? "failed" : "processed"}
                        </span>
                        <span className="text-[11px] font-mono text-purple-300 font-bold">{log.ig_handle}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 font-medium">{dateClean}</span>
                    </div>
                    
                    <p className="text-[11px] font-sans text-slate-350 pr-4 truncate">
                      "{log.message}"
                    </p>

                    {log.apiResponse && log.apiResponse.reply && (
                      <div className="border-l border-purple-500/30 pl-2 mt-1 py-0.5">
                        <p className="text-[10px] text-slate-400 italic font-mono leading-none truncate">
                          Haiku response: "{log.apiResponse.reply}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {webhookLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <Activity size={32} className="text-slate-600 animate-pulse" />
                  <div>
                    <p className="text-xs font-mono text-slate-400 font-bold">Consola vacía</p>
                    <p className="text-[10px] text-slate-500 mt-1">Envía una dm simulada desde la izquierda para activar los logs conversacionales.</p>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* MODAL / BOTTOM SHEET TO INSPECT COMPLETELY WEBHOOK EVENT JSON PAYLOADS */}
      {inspectLog && (
        <div className="fixed inset-0 bg-[#04060b]/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#0e1422] border border-[#1e2d44] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            
            <div className="px-5 py-4 border-b border-[#1e2d44] flex items-center justify-between bg-[#142036]/60">
              <div className="flex items-center gap-2">
                <Terminal className="text-purple-400" size={16} />
                <h3 className="font-mono text-xs text-slate-200 uppercase font-bold">Inspección de Webhook Hook Payload</h3>
              </div>
              <button 
                onClick={() => setInspectLog(null)} 
                className="text-[10px] text-slate-400 hover:text-white bg-[#142036] px-2.5 py-1 rounded"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* Event stats badge row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#080c14] border border-[#1e2d44] rounded-xl p-3">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Origen del Lead</span>
                  <span className="text-xs text-slate-200 mt-0.5 block font-bold">{inspectLog.ig_handle}</span>
                </div>
                <div className="bg-[#080c14] border border-[#1e2d44] rounded-xl p-3">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Timestamp de Invocación</span>
                  <span className="text-xs text-slate-200 mt-0.5 block font-mono">{inspectLog.timestamp || "Justo ahora"}</span>
                </div>
              </div>

              {/* Input raw request */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Estructura Petición Entrante (POST body):</span>
                <pre className="p-3 bg-[#0c1220] border border-[#1e2d44]/50 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify({
                    ig_handle: inspectLog.ig_handle,
                    message: inspectLog.message,
                    account_id: inspectLog.accountId,
                    campaign_id: inspectLog.campaignId
                  }, null, 2)}
                </pre>
              </div>

              {/* Output raw response */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Respuesta Inteligente de Claude Haiku:</span>
                {inspectLog.apiResponse ? (
                  <pre className="p-3 bg-[#0c1220] border border-[#1e2d44]/50 rounded-xl text-[10px] font-mono text-purple-300 overflow-x-auto leading-relaxed">
                    {JSON.stringify(inspectLog.apiResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400">
                    <span className="font-bold">Error en la ejecución:</span> {inspectLog.error || "No se pudo invocar el servicio de IA."}
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 border-t border-[#1e2d44] bg-[#0c1220] flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-500">ID del Registro: {inspectLog.id}</span>
              {inspectLog.apiResponse && (
                <button
                  onClick={() => {
                    setInspectLog(null);
                    // Find matching contact by ig_handle
                    onGoToCRMContact(inspectLog.ig_handle);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl text-xs font-display font-medium hover:scale-[1.02] transition"
                >
                  Ver Perfil CRM de Lead <ChevronRight size={13} />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
