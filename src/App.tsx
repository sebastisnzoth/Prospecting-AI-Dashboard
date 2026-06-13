import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  Send, 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  Activity, 
  Bot, 
  Smartphone, 
  ShieldAlert, 
  User, 
  Users, 
  Plus, 
  Tag, 
  Search, 
  Trash2, 
  Save, 
  LayoutDashboard, 
  Megaphone, 
  PenTool, 
  Volume2, 
  Play, 
  Pause,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  History,
  Settings,
  Inbox,
  Database,
  Terminal,
  Globe,
  Copy,
  Check
} from "lucide-react";
import { Service, IGAccount, Campaign, Contact, DailyStat, Message } from "./types";
import CalendarView from "./components/CalendarView";
import WebhookAndDbView from "./components/WebhookAndDbView";

export default function App() {
  const [activeTab, setActiveView] = useState<"dashboard" | "campanias" | "catalogo" | "crm" | "reportes" | "calendario" | "webhooks">("dashboard");
  
  // App States synchronized with standard Backend Store
  const [services, setServices] = useState<Service[]>([]);
  const [accounts, setAccounts] = useState<IGAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Form states for creating/editing service
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isEditingService, setIsEditingService] = useState<boolean>(false);
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({});
  const [activeServiceTab, setActiveServiceTab] = useState<"info" | "avatar" | "prompt">("info");

  // CRM State
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [crmSearch, setCrmSearch] = useState<string>("");
  const [crmFilter, setCrmFilter] = useState<string>("all");
  const [simulatorMessage, setSimulatorMessage] = useState<string>("");
  const [isSimulatingAI, setIsSimulatingAI] = useState<boolean>(false);
  const [copilotPrompt, setCopilotPrompt] = useState<string>("");
  const [copilotSuggestion, setCopilotSuggestion] = useState<{ reply: string; explainer: string } | null>(null);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);

  // Outreach Simulator Modal Trigger
  const [showOutreachModal, setShowOutreachModal] = useState<boolean>(false);
  const [outreachCampaignId, setOutreachCampaignId] = useState<string>("");
  const [outreachHandlesInput, setOutreachCampaignHandles] = useState<string>("");
  const [outreachLoading, setOutreachLoading] = useState<boolean>(false);
  const [outreachResultLogs, setOutreachResultLogs] = useState<string[]>([]);

  // Follow-up Cron simulator
  const [cronLoading, setCronLoading] = useState<boolean>(false);

  // Webhook Simulator & Supabase states
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<any>({
    url: "https://ftyvtfnvechetczhcbfe.supabase.co",
    hasApiKey: false,
    status: "sandbox_fallback",
    region: "sa-east-1 (São Paulo)",
    engine: "Supabase Core Edge Engine",
    syncEnabled: false
  });
  const [selectedWebhookLog, setSelectedWebhookLog] = useState<any | null>(null);
  const [simMessageHandle, setSimMessageHandle] = useState<string>("@pizzeria_pachino");
  const [simCampaignId, setSimCampaignId] = useState<string>("");
  const [simAccountId, setSimAccountId] = useState<string>("");
  const [simMessageBody, setSimMessageBody] = useState<string>("¡Hola! Vi su publicación. Me interesa cotizar automatización, ¿cuáles son los precios?");
  const [simulatingWebhook, setSimulatingWebhook] = useState<boolean>(false);

  // Fetch complete store from our Express API on mount
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/store");
      if (!response.ok) throw new Error("Failed to communicate with Express backend API.");
      const data = await response.json();
      
      setServices(data.services || []);
      setAccounts(data.accounts || []);
      setCampaigns(data.campaigns || []);
      setContacts(data.contacts || []);
      setStats(data.stats || []);
      
      // Update selected contact references if active
      if (selectedContact) {
        const freshContact = data.contacts.find((c: any) => c.id === selectedContact.id);
        if (freshContact) setSelectedContact(freshContact);
      }

      // Fetch Webhook simulation logs
      try {
        const whResponse = await fetch("/api/webhook-events");
        if (whResponse.ok) {
          const whData = await whResponse.json();
          setWebhookLogs(whData || []);
        }
      } catch (err) {
        console.error("Error loading webhook logs:", err);
      }

      // Fetch active Supabase config
      try {
        const sbResponse = await fetch("/api/supabase-config");
        if (sbResponse.ok) {
          const sbData = await sbResponse.json();
          setSupabaseConfig(sbData);
        }
      } catch (err) {
        console.error("Error loading supabase config:", err);
      }
      
      setError(null);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred while fetching system state.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerActionNotice = (message: string, type: "success" | "error" | "info" = "success") => {
    setActionNotice({ message, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // --- Services Actions ---
  const handleEditServiceSetup = (service: Service) => {
    setSelectedService(service);
    setServiceForm({ ...service });
    setIsEditingService(true);
    setActiveServiceTab("info");
  };

  const handleCreateServiceSetup = () => {
    setSelectedService(null);
    const uniqueColor = ["#00C8F0", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#EC4899"][Math.floor(Math.random() * 6)];
    setServiceForm({
      name: "",
      category: "",
      avatar: "",
      calendarLink: "",
      aiPrompt: "Eres un consultor de negocios listo para persuadir. Pregunta al prospecto [nombre]: ...",
      color: uniqueColor
    });
    setIsEditingService(true);
    setActiveServiceTab("info");
  };

  const handleSaveService = async () => {
    if (!serviceForm.name?.trim()) {
      triggerActionNotice("Por favor ingresa un nombre para el servicio.", "error");
      return;
    }
    try {
      const isNew = !selectedService;
      const url = isNew ? "/api/services" : `/api/services/${selectedService.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceForm)
      });
      if (!response.ok) throw new Error("API error while saving service");
      
      triggerActionNotice(isNew ? "¡Servicio creado con éxito!" : "¡Servicio actualizado correctamente!");
      setIsEditingService(false);
      setSelectedService(null);
      await fetchAllData();
    } catch (e) {
      triggerActionNotice("No se pudo guardar el servicio.", "error");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este servicio? Esto también afectará las campañas asociadas.")) return;
    try {
      const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("API error deleting service");
      triggerActionNotice("Servicio eliminado con éxito del catálogo.");
      setIsEditingService(false);
      setSelectedService(null);
      await fetchAllData();
    } catch (e) {
      triggerActionNotice("Error al eliminar el servicio.", "error");
    }
  };

  // --- Campaign Actions ---
  const handleToggleCampaign = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}/toggle`, { method: "POST" });
      if (!response.ok) throw new Error("API error toggle campaigns");
      triggerActionNotice("Estado de la campaña modificado.");
      await fetchAllData();
    } catch (e) {
      triggerActionNotice("No se pudo cambiar el estado de la campaña.", "error");
    }
  };

  // --- Bulk Outreach Invoker ---
  const handleLaunchOutreach = async () => {
    if (!outreachCampaignId) {
      triggerActionNotice("Selecciona una campaña para la prospección.", "error");
      return;
    }
    const cleanHandles = outreachHandlesInput
      .split("\n")
      .map(h => h.trim())
      .filter(h => h.length > 0 && h.startsWith("@"));

    if (cleanHandles.length === 0) {
      triggerActionNotice("No ingresaste handles válidos de Instagram. Asegúrate de incluir el '@'. Ej: @cafe_centro", "error");
      return;
    }

    setOutreachLoading(true);
    setOutreachResultLogs([]);
    try {
      const response = await fetch("/api/send-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: outreachCampaignId,
          handles: cleanHandles
        })
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Outreach dispatch failed");
      
      setOutreachResultLogs(resData.logs || ["Procesado correctamente."]);
      triggerActionNotice(`¡Prospección enviada! ${resData.sent} enviados, ${resData.skipped} omitidos.`);
      setOutreachCampaignHandles("");
      await fetchAllData();
    } catch (e: any) {
      triggerActionNotice(e.message || "Fallo en la llamada de prospección entrante.", "error");
    } finally {
      setOutreachLoading(false);
    }
  };

  // --- Follow-up Cron Simulator ---
  const simulateFollowUpCron = async (dryRun: boolean = true) => {
    setCronLoading(true);
    try {
      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dry_run: dryRun })
      });
      const data = await response.json();
      triggerActionNotice(`[Cron Executed]: ${data.message} - ${data.processed} leads procesados.`);
      await fetchAllData();
    } catch (e) {
      triggerActionNotice("Error al simular ejecución del Cron.", "error");
    } finally {
      setCronLoading(false);
    }
  };

  // --- CRM & Interactive Simulator Actions ---
  const handleSaveContactNotes = async (contactId: string, notes: string) => {
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });
      // Silent update on client state as notes are autosaved
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, notes } : c));
    } catch (e) {
      console.error("Autosave notes failed");
    }
  };

  const handleSimulateProspectMessage = async () => {
    if (!selectedContact) return;
    if (!simulatorMessage.trim()) {
      triggerActionNotice("Por favor escribe un mensaje para simular la respuesta del prospecto.", "error");
      return;
    }

    const payloadText = simulatorMessage.trim();
    setSimulatorMessage("");
    setIsSimulatingAI(true);

    // Optimistic UI updates - Append client reply immediately
    const localProspectMsg: Message = {
      id: `local-p-${Date.now()}`,
      sender: "prospect",
      content: payloadText,
      timestamp: "Justo ahora"
    };
    
    setSelectedContact(prev => prev ? {
      ...prev,
      messages: [...prev.messages, localProspectMsg]
    } : null);

    try {
      const response = await fetch(`/api/contacts/${selectedContact.id}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: payloadText })
      });
      if (!response.ok) throw new Error("Simulation endpoint error");
      const resData = await response.json();
      
      // Update data and refresh UI cleanly
      await fetchAllData();
      triggerActionNotice("Respuesta de IA generada y registrada con éxito.");
    } catch (e: any) {
      triggerActionNotice("Hubo un problema al procesar el mensaje por la IA.", "error");
    } finally {
      setIsSimulatingAI(false);
    }
  };

  const handleGetCopilotSuggestion = async () => {
    if (!selectedContact) return;
    setCopilotLoading(true);
    setCopilotSuggestion(null);

    try {
      const response = await fetch("/api/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: selectedContact.id,
          custom_instruction: copilotPrompt.trim()
        })
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      
      if (data.suggested_reply) {
        setCopilotSuggestion({
          reply: data.suggested_reply,
          explainer: data.explainer || "Excelente alternativa para guiar la conversación comercial"
        });
        setCopilotPrompt("");
        triggerActionNotice("¡Sugerencia de Gemini recibida!");
      } else {
        throw new Error();
      }
    } catch (e) {
      triggerActionNotice("No se pudo obtener la sugerencia de Gemini.", "error");
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleFireSimulatedWebhook = async () => {
    if (!simMessageHandle.trim() || !simMessageBody.trim()) {
      triggerActionNotice("El handle y el mensaje son obligatorios", "error");
      return;
    }
    setSimulatingWebhook(true);
    try {
      const activeCampaign = campaigns.find(c => c.id === simCampaignId) || campaigns[0];
      const activeAccount = accounts.find(a => a.id === simAccountId) || accounts[0];

      const response = await fetch("/api/handle-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ig_handle: simMessageHandle.trim(),
          message: simMessageBody.trim(),
          account_id: activeAccount?.id || "",
          campaign_id: activeCampaign?.id || ""
        })
      });

      if (!response.ok) throw new Error("La Edge Function simulada devolvió un error.");
      const result = await response.json();

      triggerActionNotice("¡Webhook simulado procesado por el motor de IA!");
      await fetchAllData();
      
      // Auto pre-select the newly added / edited contact for instant tracking in CRM if desired
      if (result.contact_id) {
        const freshContact = contacts.find(c => c.id === result.contact_id);
        if (freshContact) {
          setSelectedContact(freshContact);
        }
      }
    } catch (err: any) {
      triggerActionNotice(err.message || "Fallo despachando webhook de simulación.", "error");
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleClearWebhookLogs = async () => {
    try {
      const response = await fetch("/api/webhook-events/clear", { method: "POST" });
      if (response.ok) {
        triggerActionNotice("Historial de Webhooks vaciado con éxito.");
        fetchAllData();
      }
    } catch (err) {
      triggerActionNotice("Fallo al vaciar bitácora de Webhooks", "error");
    }
  };

  // Calculations & Analytics metrics
  const totalSent = campaigns.reduce((acc, c) => acc + c.messagesSent, 0);
  const totalReplies = campaigns.reduce((acc, c) => acc + c.replies, 0);
  const totalQualified = campaigns.reduce((acc, c) => acc + c.qualified, 0);
  const totalScheduled = campaigns.reduce((acc, c) => acc + c.scheduled, 0);
  
  const conversionRate = totalSent > 0 ? ((totalScheduled / totalSent) * 100).toFixed(2) : "0.00";
  const replyRate = totalSent > 0 ? ((totalReplies / totalSent) * 100).toFixed(1) : "0.0";
  const qualifRate = totalReplies > 0 ? ((totalQualified / totalReplies) * 100).toFixed(1) : "0";

  // Filtered contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
      contact.handle.toLowerCase().includes(crmSearch.toLowerCase()) ||
      contact.businessType.toLowerCase().includes(crmSearch.toLowerCase());
      
    const matchesFilter = crmFilter === "all" || contact.status === crmFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen bg-navy-900 text-slate-100 font-sans overflow-hidden">
      
      {/* Action Banner Toast */}
      {actionNotice && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-up flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-xs font-medium font-display transition-all ${
          actionNotice.type === "success" 
            ? "bg-emerald-950/90 text-emerald-400 border-emerald-500/30" 
            : actionNotice.type === "error"
            ? "bg-rose-950/90 text-rose-400 border-rose-500/30"
            : "bg-cyan-950/90 text-cyan-400 border-cyan-500/30"
        }`}>
          {actionNotice.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Modern Left Sidebar Navigation */}
      <aside className="w-[72px] h-screen flex flex-col items-center py-5 gap-4 border-r border-[#1e2d44] bg-[#0e1422] shrink-0 z-10">
        
        {/* App Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-[#8B5CF6] flex items-center justify-center mb-2 shadow-lg scale-95 duration-300">
          <Bot size={20} className="text-[#0e1422] font-black" />
        </div>

        {/* Tab Items */}
        <nav className="flex flex-col gap-2 w-full px-2 flex-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "campanias", label: "Campañas", icon: Megaphone },
            { id: "catalogo", label: "Servicios", icon: PenTool },
            { id: "calendario", label: "Calendario", icon: Calendar },
            { id: "crm", label: "CRM", icon: Users },
            { id: "reportes", label: "Reportes", icon: TrendingUp },
            { id: "webhooks", label: "Webhook & DB", icon: Settings }
          ].map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveView(id as any);
                  setIsEditingService(false);
                }}
                className={`relative w-full flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-[#142036] text-cyan-400 shadow-inner" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-[#142036]/40"
                }`}
                title={label}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r-full" />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[9px] font-display font-medium tracking-wide leading-none">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Active Status indicator */}
        <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl bg-[#142036] border border-[#1e2d44]">
          <span className="live-dot" />
          <span className="text-[8px] font-mono text-emerald-400 font-medium">LIVE</span>
        </div>
      </aside>

      {/* Main Container viewport */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#080c14]">
        
        {/* Top Header bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[#1e2d44] bg-[#0e1422]">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-sm tracking-widest text-[#00C8F0]">PROSPECTING AI V1.0</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[#142036] text-slate-400 border border-[#1e2d44]">SOLUCIÓN DE PROSPECCIÓN DIRECTA</span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Quick manual cron triggers */}
            <div className="flex items-center gap-2 border-r border-[#1e2d44] pr-4">
              <button 
                onClick={() => simulateFollowUpCron(true)}
                disabled={cronLoading}
                className="text-[10px] flex items-center gap-1 font-mono text-slate-400 hover:text-cyan-400 disabled:opacity-40 transition-colors"
                title="Chequear inactividad de leads sin enviar mensajes reales"
              >
                <History size={12} />
                Test Inactivos (Dry Run)
              </button>
              <button 
                onClick={() => simulateFollowUpCron(false)}
                disabled={cronLoading}
                className="text-[10px] flex items-center gap-1 font-mono text-amber-500 hover:text-amber-400 disabled:opacity-40 transition-colors"
                title="Enviar follow-up automáticamente a inactivos > 24hs"
              >
                <RefreshCw size={11} className={cronLoading ? "animate-spin" : ""} />
                Ejecutar Cron Real
              </button>
            </div>

            <button 
              onClick={fetchAllData}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#142036] rounded-xl transition-all"
              title="Sincronizar Panel"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#142036]/60 border border-[#1e2d44] rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
              <span className="text-xs font-mono font-medium text-slate-300">Sebastian</span>
            </div>
          </div>
        </header>

        {loading && !contacts.length ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
            <p className="text-sm font-display text-slate-400">Cargando base de datos y métricas en tiempo real...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="text-rose-500 mb-2" size={40} />
            <h3 className="font-display font-semibold text-lg text-white">Error de Iniciación</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">{error}</p>
            <button 
              onClick={fetchAllData}
              className="mt-4 px-4 py-2 bg-[#142036] border border-[#1e2d44] rounded-lg text-xs font-display hover:bg-[#1e2d44] transition"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            
            {/* VIEW 1: CENTRO DE MANDO (DASHBOARD) */}
            {activeTab === "dashboard" && (
              <div className="p-6 space-y-6 animate-slide-up">
                <main className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="font-display text-2xl font-semibold text-white tracking-tight">Centro de Mando</h1>
                      <p className="text-slate-500 text-sm mt-0.5">Visión global de tu embudo de prospección automatizado.</p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setOutreachCampaignId(campaigns[0]?.id || "");
                          setOutreachResultLogs([]);
                          setShowOutreachModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-[#090c14] rounded-xl text-xs font-display font-bold hover:bg-cyan-400 transition-colors shadow-lg"
                      >
                        <Send size={13} />
                        Lanzar Prospección de Leads
                      </button>
                    </div>
                  </div>

                  {/* Top Stats Cards row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Mensajes Enviados", value: totalSent, color: "#00C8F0", footer: "Enviados por cuentas satélite", icon: Send },
                      { label: "Respuestas", value: totalReplies, color: "#8B5CF6", footer: `${replyRate}% tasa de respuesta`, icon: TrendingUp },
                      { label: "Leads Calificados", value: totalQualified, color: "#10B981", footer: `${qualifRate}% de respuestas calificados`, icon: CheckCircle },
                      { label: "Citas Agendadas", value: totalScheduled, color: "#F59E0B", footer: `${conversionRate}% de éxito (envíos -> cita)`, icon: Calendar }
                    ].map((card, i) => (
                      <div key={i} className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 hover:border-slate-700 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-slate-400 text-xs font-display font-medium uppercase tracking-wider">{card.label}</span>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15` }}>
                            <card.icon size={14} style={{ color: card.color }} />
                          </div>
                        </div>
                        <div className="font-display text-3xl font-bold text-white mb-2">
                          {card.value.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 font-mono" style={{ color: card.color }}>{card.footer}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Activity Area Graph Simulator (using native crisp raw SVG for guaranteed visual look and performance) */}
                    <div className="lg:col-span-2 bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-sm text-white">Ratio de Actividad Diaria</h3>
                          <p className="text-xs text-slate-500">Volumen histórico de prospección y citas convertidas.</p>
                        </div>
                        {/* Legend */}
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <span className="w-2.5 h-1 bg-cyan-400 rounded-sm"></span> Enviados
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-400">
                            <span className="w-2.5 h-1 bg-purple-500 rounded-sm"></span> Respuestas
                          </span>
                        </div>
                      </div>

                      {/* Native Custom SVG chart mapping stats */}
                      <div className="relative pt-2 h-48 w-full bg-[#080c14]/40 rounded-xl border border-[#1e2d44]/30 p-2">
                        {stats.length > 0 ? (
                          <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                            {/* Grids lines */}
                            <line x1="0" y1="10" x2="500" y2="10" stroke="#1e2d44" strokeWidth="0.5" strokeDasharray="4" />
                            <line x1="0" y1="60" x2="500" y2="60" stroke="#1e2d44" strokeWidth="0.5" strokeDasharray="4" />
                            <line x1="0" y1="110" x2="500" y2="110" stroke="#1e2d44" strokeWidth="0.5" strokeDasharray="4" />
                            
                            {/* Area 1: Sent */}
                            <path 
                              d={`M 0,110 ${stats.map((s, idx) => `L ${(idx / (stats.length - 1)) * 500},${110 - (s.sent / 1200) * 100}`).join(" ")} L 500,110 Z`}
                              fill="url(#gradient-sent)" 
                              opacity="0.3"
                            />
                            <path 
                              d={stats.map((s, idx) => `${idx === 0 ? "M" : "L"} ${(idx / (stats.length - 1)) * 500},${110 - (s.sent / 1200) * 100}`).join(" ")}
                              fill="none" 
                              stroke="#00C8F0" 
                              strokeWidth="2"
                              strokeLinecap="round"
                            />

                            {/* Area 2: Replies */}
                            <path 
                              d={`M 0,110 ${stats.map((s, idx) => `L ${(idx / (stats.length - 1)) * 500},${110 - (s.replies / 200) * 100}`).join(" ")} L 500,110 Z`}
                              fill="url(#gradient-replies)" 
                              opacity="0.35"
                            />
                            <path 
                              d={stats.map((s, idx) => `${idx === 0 ? "M" : "L"} ${(idx / (stats.length - 1)) * 500},${110 - (s.replies / 200) * 100}`).join(" ")}
                              fill="none" 
                              stroke="#8B5CF6" 
                              strokeWidth="2"
                              strokeLinecap="round"
                            />

                            {/* Gradient definitions */}
                            <defs>
                              <linearGradient id="gradient-sent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00C8F0" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#00C8F0" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="gradient-replies" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                          </svg>
                        ) : null}
                        
                        {/* X-axis labels */}
                        <div className="absolute left-2 right-2 bottom-0 flex justify-between text-[8px] font-mono text-slate-500">
                          {stats.map((s, i) => (
                            <span key={i} className="hidden sm:inline">{s.date}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick activity logs / Satelite details */}
                    <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold text-sm text-white">Cuentas Satélite</h3>
                        <span className="text-[10px] font-mono text-[#00C8F0] tracking-wider uppercase bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/20">OPERATIVAS</span>
                      </div>

                      <div className="space-y-3">
                        {accounts.slice(0, 5).map(acc => (
                          <div key={acc.id} className="flex justify-between items-center text-xs p-2.5 bg-[#080c14]/50 border border-slate-800 rounded-xl">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${acc.status === "active" ? "bg-emerald-400" : acc.status === "limited" ? "bg-amber-400" : "bg-rose-500"}`} />
                              <span className="font-mono text-slate-200">{acc.handle}</span>
                            </div>
                            <div className="text-right font-mono text-slate-400">
                              <span>{acc.sentToday}d / {acc.limit} lm</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Campaigns Card */}
                    <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h4 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
                          <Activity size={14} className="text-[#00C8F0]" />
                          Campañas Activas
                        </h4>
                        <button onClick={() => setActiveView("campanias")} className="text-xs text-cyan-400 font-medium font-display flex items-center gap-0.5 hover:underline">
                          Ir a Campañas <ExternalLink size={10} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {campaigns.filter(c => c.status === "running").map(camp => {
                          const srvInstance = services.find(s => s.id === camp.serviceId);
                          return (
                            <div key={camp.id} className="flex items-center justify-between py-2 border-b border-[#1e2d44] last:border-0">
                              <div>
                                <h5 className="text-xs font-semibold text-slate-200">{camp.name}</h5>
                                <p className="text-[10px] text-slate-500">Servicio: {srvInstance?.name || "Sin asociar"}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-slate-400">{camp.messagesSent} enviados</span>
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">{camp.scheduled} Citas</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CRM Appointments Alerts */}
                    <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h4 className="font-display font-semibold text-sm text-white flex items-center gap-1.5">
                          <Calendar size={14} className="text-amber-400" />
                          Próximas Citas Convertidas (Agente AI)
                        </h4>
                        <button onClick={() => setActiveView("crm")} className="text-xs text-amber-400 font-medium font-display flex items-center gap-0.5 hover:underline">
                          Ver CRM <ExternalLink size={10} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {contacts.filter(c => c.status === "scheduled").map(ct => (
                          <div key={ct.id} className="flex items-center justify-between py-2 border-b border-[#1e2d44] last:border-0">
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-slate-200">{ct.name}</span>
                                <span className="text-[10px] font-mono text-slate-500">{ct.handle}</span>
                              </div>
                              <p className="text-[10px] text-amber-400 font-mono">Agendado para: {ct.appointmentDate || "Falta confirmación"}</p>
                            </div>
                            <span className="text-[10px] font-display font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                              Confirmada
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            )}

            {/* VIEW 2: CAMPAÑAS */}
            {activeTab === "campanias" && (
              <div className="p-6 space-y-6 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-display text-2xl font-semibold text-white tracking-tight">Campañas de Outreach</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Controla el estado de prospección y asigna cuentas satélite.</p>
                  </div>

                  <button 
                    onClick={() => {
                      setOutreachCampaignId(campaigns[0]?.id || "");
                      setOutreachResultLogs([]);
                      setShowOutreachModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-[#090c14] rounded-xl text-xs font-display font-bold hover:bg-cyan-400 transition-colors"
                  >
                    <Plus size={14} /> Nueva Prospección
                  </button>
                </div>

                <div className="space-y-4">
                  {campaigns.map(camp => {
                    const linkedService = services.find(s => s.id === camp.serviceId);
                    const mappedAccounts = accounts.filter(a => camp.accounts.includes(a.id));
                    const responseRate = camp.messagesSent > 0 ? ((camp.replies / camp.messagesSent) * 100).toFixed(1) : "0";
                    const appointmentRate = camp.replies > 0 ? ((camp.scheduled / camp.replies) * 100).toFixed(1) : "0";

                    return (
                      <div key={camp.id} className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${linkedService?.color || "#fff"}15` }}>
                              <Bot size={18} style={{ color: linkedService?.color || "#fff" }} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-display font-bold text-white text-base">{camp.name}</h3>
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-display font-medium px-2.5 py-0.5 rounded-full border ${
                                  camp.status === "running" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                                }`}>
                                  {camp.status === "running" ? "Activa" : "Pausada"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                Servicio: {linkedService?.name || "Sin asociar"} · Iniciada: {camp.startDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleToggleCampaign(camp.id)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-display font-bold transition-all ${
                                camp.status === "running"
                                  ? "bg-amber-400/5 text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
                                  : "bg-emerald-400/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                              }`}
                            >
                              {camp.status === "running" ? <Pause size={12} /> : <Play size={12} />}
                              {camp.status === "running" ? "Pausar" : "Reanudar"}
                            </button>
                          </div>
                        </div>

                        {/* Interactive Funnel progress */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#080c14]/50 rounded-xl border border-slate-800">
                          <div className="text-center sm:border-r border-slate-800/60 last:border-none">
                            <p className="text-xs text-slate-500 uppercase font-mono">Enviados</p>
                            <p className="font-display font-bold text-lg text-white mt-1">{camp.messagesSent}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">Mensajes iniciales</p>
                          </div>
                          <div className="text-center sm:border-r border-slate-800/60 last:border-none">
                            <p className="text-xs text-slate-500 uppercase font-mono">Respuestas</p>
                            <p className="font-display font-bold text-lg text-slate-200 mt-1">{camp.replies}</p>
                            <p className="text-[10px] text-purple-400 mt-0.5">{responseRate}% tasa de resp.</p>
                          </div>
                          <div className="text-center sm:border-r border-slate-800/60 last:border-none">
                            <p className="text-xs text-slate-500 uppercase font-mono">Calificados</p>
                            <p className="font-display font-bold text-lg text-slate-200 mt-1">{camp.qualified}</p>
                            <p className="text-[10px] text-emerald-400 mt-0.5">{camp.replies > 0 ? ((camp.qualified/camp.replies)*100).toFixed(0) : 0}% de retención</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase font-mono">Citas</p>
                            <p className="font-display font-bold text-lg text-amber-400 mt-1">{camp.scheduled}</p>
                            <p className="text-[10px] text-cyan-400 mt-0.5">{appointmentRate}% de cierre</p>
                          </div>
                        </div>

                        {/* Satellite Accounts list */}
                        <div className="space-y-2">
                          <p className="text-xs font-display font-semibold text-slate-400">Cuentas satélites vinculadas:</p>
                          <div className="flex flex-wrap gap-2">
                            {mappedAccounts.map(a => {
                              const usePct = a.limit > 0 ? (a.sentToday / a.limit) * 100 : 0;
                              return (
                                <div key={a.id} className="flex items-center gap-2.5 px-3 py-1.5 bg-[#142036] rounded-xl border border-slate-800 text-xs">
                                  <span className="font-mono text-slate-300">{a.handle}</span>
                                  <span className="text-slate-600">|</span>
                                  <span className="font-mono text-slate-400 text-[10px]">{a.sentToday}/{a.limit} hov</span>
                                  <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${Math.min(usePct, 100)}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Initial message configuration */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-mono text-slate-400">Mensaje de Outreach Inicial:</span>
                          <p className="text-xs text-slate-300 italic leading-relaxed p-3 rounded-xl border border-[#1e2d44] bg-[#0c1220]/75">
                            {camp.initialMessage}
                          </p>
                          
                          <div className="flex gap-2 mt-2 items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-mono">Modelo IA:</span>
                              <select
                                value={camp.aiModel || "gemini-3.5-flash"}
                                onChange={async (e) => {
                                  const nextModel = e.target.value;
                                  try {
                                    const response = await fetch(`/api/campaigns/${camp.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ aiModel: nextModel })
                                    });
                                    if (response.ok) {
                                      triggerActionNotice("¡Modelo de campaña actualizado a " + nextModel + "!");
                                      fetchAllData();
                                    }
                                  } catch (err) {
                                    triggerActionNotice("Fallo al actualizar el modelo de la campaña.", "error");
                                  }
                                }}
                                className="bg-[#142036] border border-[#1e2d44] text-[10px] font-mono rounded px-1.5 py-0.5 text-slate-300 focus:outline-none"
                              >
                                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Sólido)</option>
                                <option value="gemini-3.1-flash-lite">Gemini 3.1 Lite (⚡ Baja latencia)</option>
                                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (🧠 Avanzado)</option>
                              </select>
                            </div>

                            <button
                              onClick={async () => {
                                const criteria = prompt("Instrucción para optimizar (opcional):", "Hazlo más amigable, directo y agrega un emoji");
                                if (criteria === null) return;
                                try {
                                  triggerActionNotice("Optimizando mensaje inicial con Gemini...", "info");
                                  const res = await fetch("/api/optimize-template", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      template: camp.initialMessage,
                                      service_name: linkedService?.name,
                                      criteria
                                    })
                                  });
                                  if (!res.ok) throw new Error();
                                  const data = await res.json();
                                  if (data.optimized && confirm("¿Deseas reemplazar el mensaje inicial original por esta sugerencia de Gemini?\n\n\"" + data.optimized + "\"")) {
                                    const saveRes = await fetch(`/api/campaigns/${camp.id}`, {
                                      method: "PUT",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ initialMessage: data.optimized })
                                    });
                                    if (saveRes.ok) {
                                      triggerActionNotice("¡Plantilla de outreach optimizada exitosamente!");
                                      fetchAllData();
                                    }
                                  }
                                } catch (e) {
                                  triggerActionNotice("Fallo optimizando la plantilla con Gemini.", "error");
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-display font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <Sparkles size={10} /> Optimizar con Gemini IA
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: SERVICIOS CATALOGO */}
            {activeTab === "catalogo" && (
              <div className="flex h-full">
                {/* Services List Panel */}
                <div className={`${isEditingService ? "w-80" : "flex-1"} p-6 overflow-y-auto duration-300 transition-all border-r border-[#1e2d44] space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="font-display text-2xl font-semibold text-white tracking-tight">Catálogo de Servicios</h1>
                      <p className="text-slate-500 text-sm mt-0.5">Asigna y entrena prompts para diferentes ofertas habituales.</p>
                    </div>

                    <button 
                      onClick={handleCreateServiceSetup}
                      className="flex items-center gap-2 px-3 py-2 bg-cyan-500 text-[#090c14] rounded-xl text-xs font-display font-semibold hover:bg-cyan-400 transition-colors"
                    >
                      <Plus size={14} /> Nuevo
                    </button>
                  </div>

                  <div className="space-y-4">
                    {services.map(srv => {
                      const isSelected = selectedService?.id === srv.id;
                      return (
                        <div 
                          key={srv.id} 
                          onClick={() => handleEditServiceSetup(srv)}
                          className={`bg-[#0e1422] border rounded-2xl p-5 hover:border-slate-700 cursor-pointer transition-all duration-300 ${
                            isSelected ? "border-cyan-500 glow-cyan" : "border-[#1e2d44]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: `${srv.color}15`, borderColor: `${srv.color}35` }}>
                                <Bot size={16} style={{ color: srv.color }} />
                              </div>
                              <div>
                                <h3 className="font-display font-bold text-white text-sm">{srv.name}</h3>
                                <p className="text-xs text-slate-500">{srv.category}</p>
                              </div>
                            </div>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteService(srv.id);
                              }}
                              className="text-slate-600 hover:text-rose-500 p-1.5 hover:bg-[#142036] rounded-xl transition"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800/40 text-xs text-slate-400 space-y-1">
                            <p className="line-clamp-2"><span className="text-slate-500">Avatar:</span> {srv.avatar}</p>
                            <p className="truncate"><span className="text-slate-500">Calendario:</span> {srv.calendarLink}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Service Detail Editor (Dynamic Panels) */}
                {isEditingService && (
                  <div className="flex-1 bg-[#0a0f1c] flex flex-col overflow-hidden animate-slide-up duration-300">
                    <div className="flex items-center justify-between p-5 border-b border-[#1e2d44] bg-[#0e1422]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ background: `${serviceForm.color}15`, borderColor: `${serviceForm.color}35` }}>
                          <Bot size={14} style={{ color: serviceForm.color }} />
                        </div>
                        <div>
                          <h2 className="font-display font-semibold text-white text-sm">{selectedService ? "Editar Servicio" : "Crear Nuevo Servicio"}</h2>
                          <p className="text-xs text-slate-500">Define los parámetros de la IA integrados en el CRM.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsEditingService(false)}
                        className="text-xs text-slate-450 hover:text-white"
                      >
                        Cerrar
                      </button>
                    </div>

                    {/* Tab Selection */}
                    <div className="flex border-b border-[#1e2d44] bg-[#0e1422]/60 px-5">
                      {[
                        { id: "info", title: "Información" },
                        { id: "avatar", title: "Cliente Ideal (Avatar)" },
                        { id: "prompt", title: "Prompt de IA" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveServiceTab(tab.id as any)}
                          className={`px-4 py-3 text-xs font-display font-medium border-b-2 transition-all -mb-px ${
                            activeServiceTab === tab.id 
                              ? "border-cyan-400 text-cyan-400" 
                              : "border-transparent text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {tab.title}
                        </button>
                      ))}
                    </div>

                    {/* Service edit fields */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {activeServiceTab === "info" && (
                        <div className="space-y-4 animate-slide-up">
                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 font-display font-medium">Nombre del Servicio:</label>
                            <input 
                              type="text" 
                              value={serviceForm.name} 
                              onChange={e => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Ej. Automatizaciones con IA para E-commerce" 
                              className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 font-display font-medium">Categoría:</label>
                            <input 
                              type="text" 
                              value={serviceForm.category} 
                              onChange={e => setServiceForm(prev => ({ ...prev, category: e.target.value }))}
                              placeholder="Ej. Automatizaciones o Marketing" 
                              className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 font-display font-medium">Calendario link (Calendly / Google Cal):</label>
                            <input 
                              type="text" 
                              value={serviceForm.calendarLink} 
                              onChange={e => setServiceForm(prev => ({ ...prev, calendarLink: e.target.value }))}
                              placeholder="https://calendly.com/miagencia/ai-funnel" 
                              className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-400 transition"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs text-slate-400 font-display font-medium block">Color Tema del Servicio:</label>
                            <div className="flex gap-2">
                              {["#00C8F0", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#EC4899"].map(color => (
                                <button 
                                  key={color} 
                                  onClick={() => setServiceForm(prev => ({ ...prev, color }))}
                                  className={`w-6 h-6 rounded-lg transition-transform ${serviceForm.color === color ? "scale-110 ring-2 ring-white" : ""}`}
                                  style={{ background: color }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeServiceTab === "avatar" && (
                        <div className="space-y-3 animate-slide-up">
                          <label className="text-xs text-slate-400 font-display font-medium block">Descripción detallada del Cliente Ideal:</label>
                          <span className="text-[10px] text-slate-500 block leading-tight">Explica a la IA el perfil del cliente para que califique según el perfil de leads.</span>
                          <textarea 
                            value={serviceForm.avatar} 
                            onChange={e => setServiceForm(prev => ({ ...prev, avatar: e.target.value }))}
                            rows={8}
                            placeholder="Dueños de agencias B2B con equipo de ventas manual que facturen arriba de $10k al mes y requieran prospectores eficientes de IA..."
                            className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-sm leading-relaxed focus:outline-none focus:border-cyan-400 transition resize-none"
                          />
                        </div>
                      )}

                      {activeServiceTab === "prompt" && (
                        <div className="space-y-3 animate-slide-up">
                          <label className="text-xs text-slate-400 font-display font-medium block">Instrucciones y Prompt para el Agente IA:</label>
                          <span className="text-[10px] text-slate-500 block leading-tight">Este prompt instruirá a Gemini para realizar preguntas de calificación y guiar a la cita con el link.</span>
                          <textarea 
                            value={serviceForm.aiPrompt} 
                            onChange={e => setServiceForm(prev => ({ ...prev, aiPrompt: e.target.value }))}
                            rows={12}
                            className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-xs font-mono leading-relaxed focus:outline-none focus:border-cyan-400 transition"
                          />
                          <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-1">
                            <span className="text-[11px] font-display font-semibold text-purple-400">Variables dinámicas soportadas por el sistema:</span>
                            <div className="flex flex-wrap gap-1.5 text-[9px] font-mono text-slate-400 pt-1">
                              <span className="bg-[#142036] px-1.5 py-0.5 rounded border border-[#1e2d44]">[nombre]</span>
                              <span className="bg-[#142036] px-1.5 py-0.5 rounded border border-[#1e2d44]">[tipo_negocio]</span>
                              <span className="bg-[#142036] px-1.5 py-0.5 rounded border border-[#1e2d44]">[handle]</span>
                              <span className="bg-[#142036] px-1.5 py-0.5 rounded border border-[#1e2d44]">[fecha_actual]</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-5 border-t border-[#1e2d44] bg-[#0e1422] flex gap-2">
                      <button 
                        onClick={handleSaveService}
                        className="flex-1 py-2 bg-cyan-500 text-[#090c14] rounded-xl text-xs font-display font-bold hover:bg-cyan-400 transition"
                      >
                        {selectedService ? "Guardar Cambios" : "Crear Servicio"}
                      </button>
                      <button 
                        onClick={() => setIsEditingService(false)}
                        className="px-4 py-2 bg-[#142036] border border-[#1e2d44] rounded-xl text-xs font-display text-slate-400 hover:bg-[#1e2d44] transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: CRM (LEADS Y CHAT DE IA) */}
            {activeTab === "crm" && (
              <div className="flex h-full">
                {/* Contacts Filtering and List */}
                <div className="w-[340px] md:w-[400px] flex flex-col border-r border-[#1e2d44] shrink-0">
                  <div className="p-4 border-b border-[#1e2d44] space-y-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        type="text" 
                        value={crmSearch}
                        onChange={e => setCrmSearch(e.target.value)}
                        placeholder="Buscar por handle, negocio..." 
                        className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>

                    {/* Filter states badges */}
                    <div className="flex flex-wrap gap-1">
                      <button 
                        onClick={() => setCrmFilter("all")}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-display font-medium border ${
                          crmFilter === "all" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-[#142036] text-slate-500 border-transparent hover:text-slate-300"
                        }`}
                      >
                        Todos ({contacts.length})
                      </button>
                      {[
                        { id: "contacted", label: "Contactados", color: "text-cyan-400" },
                        { id: "qualified", label: "Cualificados", color: "text-[#8B5CF6]" },
                        { id: "scheduled", label: "Cita Agendada", color: "text-amber-500" },
                        { id: "lost", label: "Perdidos", color: "text-rose-500" }
                      ].map(f => (
                        <button 
                          key={f.id}
                          onClick={() => setCrmFilter(f.id)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-display font-medium border ${
                            crmFilter === f.id ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-[#142036] text-slate-500 border-transparent hover:text-slate-300"
                          }`}
                        >
                          {f.label} ({contacts.filter(c => c.status === f.id).length})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-[#1e2d44]/30">
                    {filteredContacts.map(c => {
                      const isSelected = selectedContact?.id === c.id;
                      const srv = services.find(s => s.id === c.serviceId);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => {
                            setSelectedContact(c);
                            setSimulatorMessage("");
                          }}
                          className={`p-4 cursor-pointer transition-colors ${
                            isSelected ? "bg-[#142036]" : "hover:bg-[#0e1422]/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-mono text-slate-400 font-semibold">{c.handle}</p>
                              <h4 className="text-sm font-display font-bold text-white mt-0.5">{c.name}</h4>
                              <p className="text-[10px] text-slate-500">{c.businessType}</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[9px] font-display font-bold px-2 py-0.5 rounded-full border ${
                                c.status === "scheduled"
                                  ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                                  : c.status === "qualified"
                                  ? "text-purple-400 bg-purple-400/10 border-purple-400/20"
                                  : c.status === "lost"
                                  ? "text-rose-400 bg-rose-400/10 border-rose-400/20"
                                  : "text-slate-400 bg-slate-400/10 border-slate-500/20"
                              }`}>
                                {c.status === "scheduled" ? "Agendado" : c.status === "qualified" ? "Calificado" : c.status === "lost" ? "Fallo" : "Prospecto"}
                              </span>
                              <span className="text-[9px] text-slate-600 font-mono">{c.lastContact}</span>
                            </div>
                          </div>

                          {srv && (
                            <div className="mt-2.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: srv.color }} />
                              <span className="text-[9px] text-slate-500 uppercase tracking-wider">{srv.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {filteredContacts.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs font-display">
                        No se encontraron contactos en tu CRM.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Interactive Chat Panel Simulator */}
                <div className="flex-1 flex flex-col bg-[#0a0f1c] overflow-hidden">
                  {selectedContact ? (
                    <div className="flex-1 flex flex-col overflow-hidden animate-slide-up">
                      
                      {/* Contact metadata top block */}
                      <div className="p-5 border-b border-[#1e2d44] bg-[#0e1422] space-y-4 shrink-0">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                              <User className="text-slate-400" size={16} />
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-white text-base leading-tight">{selectedContact.name}</h3>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedContact.handle} · {selectedContact.businessType}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-mono">Fase IA:</span>
                            <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md font-mono text-[10px]">
                              {selectedContact.conv_stage || "intro"}
                            </span>
                          </div>
                        </div>

                        {/* Answers Qualifier and interactive notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          
                          {/* AI Extracted Answers JSON visualizer */}
                          <div className="p-3 bg-[#080c14] border border-[#1e2d44] rounded-xl space-y-1">
                            <span className="text-[10px] font-display font-semibold text-slate-400 block uppercase tracking-wider">Criterios Cualificados por IA:</span>
                            {selectedContact.conv_answers && Object.keys(selectedContact.conv_answers).length > 0 ? (
                              <div className="space-y-1.5 pt-1">
                                {Object.entries(selectedContact.conv_answers).map(([key, val]) => (
                                  <div key={key} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-mono">{key}:</span>
                                    <span className="text-emerald-400 font-medium">{val}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-600 italic pt-1">Ninguna respuesta de calificación detectada aún.</p>
                            )}
                          </div>

                          {/* Quick editable Notes area */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-display font-semibold text-slate-400 block uppercase tracking-wider">Notas de Operador:</span>
                            <textarea 
                              value={selectedContact.notes || ""} 
                              onChange={e => handleSaveContactNotes(selectedContact.id, e.target.value)}
                              placeholder="Escribe detalles del lead o notas de seguimiento (Guarda automáticamente)..."
                              rows={2}
                              className="w-full bg-[#142036]/60 border border-[#1e2d44] rounded-xl px-2 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-cyan-500 transition resize-none leading-relaxed"
                            />
                          </div>

                        </div>
                      </div>

                      {/* Chat screen logs */}
                      <div className="flex-1 overflow-y-auto p-5 bg-[#080c14]/40 space-y-4">
                        <div className="text-center p-3">
                          <span className="text-[10px] font-mono text-slate-650 bg-slate-800/20 border border-slate-800/40 px-3 py-1 rounded-full uppercase tracking-wider">
                            Inicio de Automatización IA · Instagram Direct
                          </span>
                        </div>

                        {selectedContact.messages.map(m => {
                          const isAI = m.sender === "ai";
                          return (
                            <div key={m.id} className={`flex gap-3 ${isAI ? "" : "flex-row-reverse"}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 mt-0.5 ${
                                isAI ? "bg-purple-950/40 border-purple-500/30 text-purple-400" : "bg-slate-800 border-slate-700 text-slate-350"
                              }`}>
                                {isAI ? <Bot size={12} /> : <User size={12} />}
                              </div>
                              <div className={`flex flex-col max-w-[75%] ${isAI ? "items-start" : "items-end"}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                  isAI 
                                    ? "bg-purple-500/10 border border-purple-500/25 text-purple-200" 
                                    : "bg-[#142036] border border-[#1e2d44] text-slate-205"
                                }`}>
                                  {m.content}
                                </div>
                                <span className="text-[9px] text-slate-600 font-mono mt-1 pr-1">{m.timestamp}</span>
                              </div>
                            </div>
                          );
                        })}

                        {isSimulatingAI && (
                          <div className="flex gap-3 animate-pulse">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center border bg-purple-950/40 border-purple-500/30 text-purple-400 shrink-0">
                              <Bot size={12} />
                            </div>
                            <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl px-4 py-2 text-xs text-purple-400 flex items-center gap-1.5 font-mono">
                              <Loader2 className="animate-spin" size={10} />
                              El agente de IA está analizando y calificando la respuesta...
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive Simulator Input tool */}
                      <div className="p-4 border-t border-[#1e2d44] bg-[#0e1422] space-y-3 shrink-0">
                        
                        {/* Gemini Response Copilot module */}
                        <div className="bg-[#0b101c] border border-purple-500/10 rounded-xl p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                              <Bot size={12} className="text-purple-400 animate-pulse" />
                              Gemini Respuesta Copilot
                            </span>
                            <span className="text-[9px] text-slate-500 font-display">Asistencia contextual para el operador humano</span>
                          </div>

                          {copilotSuggestion && (
                            <div className="bg-purple-950/15 border border-purple-500/20 rounded-xl p-3 space-y-2.5 animate-slide-up">
                              <p className="text-xs text-purple-200 leading-relaxed font-sans italic">
                                "{copilotSuggestion.reply}"
                              </p>
                              {copilotSuggestion.explainer && (
                                <p className="text-[10px] text-slate-400 font-sans border-t border-purple-950/40 pt-1.5 flex items-start gap-1">
                                  <Sparkles size={10} className="text-amber-400 shrink-0 mt-0.5" />
                                  <span>{copilotSuggestion.explainer}</span>
                                </p>
                              )}
                              <div className="flex justify-end gap-1.5 pt-0.5">
                                <button
                                  onClick={() => {
                                    setSimulatorMessage(copilotSuggestion.reply);
                                    setCopilotSuggestion(null);
                                  }}
                                  className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-[9px] font-display font-bold text-purple-300 rounded-lg Transition"
                                >
                                  Usar como borrador
                                </button>
                                <button
                                  onClick={() => setCopilotSuggestion(null)}
                                  className="px-2.5 py-1 bg-[#142036] hover:bg-[#1e2d44] text-[9px] font-display text-slate-400 rounded-lg Transition"
                                >
                                  Descartar
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={copilotPrompt}
                              onChange={e => setCopilotPrompt(e.target.value)}
                              placeholder="Ej: 'Maneja objeción de costo' o presiona sugerir para continuar..." 
                              className="flex-1 bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-1.5 text-xs text-slate-350 focus:outline-none focus:border-purple-400 transition placeholder:text-slate-600"
                              disabled={copilotLoading}
                            />
                            <button 
                              onClick={handleGetCopilotSuggestion}
                              disabled={copilotLoading}
                              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 font-display font-semibold text-xs text-white disabled:opacity-40 rounded-xl transition flex items-center gap-1 shrink-0"
                            >
                              {copilotLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                              Sugerir Respuesta
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-[#1e2d44]/50 my-1"></div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                            <Sparkles size={11} className="text-cyan-400" />
                            Simular Respuesta del Prospecto
                          </span>
                          <span className="text-[9px] text-slate-600">Representa qué dice el prospecto en Instagram</span>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={simulatorMessage}
                            onChange={e => setSimulatorMessage(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && !isSimulatingAI) handleSimulateProspectMessage();
                            }}
                            placeholder="Ej: 'Sí me interesa, ¿cómo funciona?' o 'Prefiero el de automatización'" 
                            className="flex-1 bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-400 transition"
                            disabled={isSimulatingAI}
                          />
                          <button 
                            onClick={handleSimulateProspectMessage}
                            disabled={isSimulatingAI || !simulatorMessage.trim()}
                            className="px-4 py-2.5 bg-cyan-500 text-[#090c14] hover:bg-cyan-400 rounded-xl font-display font-bold text-xs disabled:opacity-30 transition flex items-center gap-1 shrink-0"
                          >
                            <Send size={11} /> Simular DM
                          </button>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <Inbox className="text-slate-650 mb-3 opacity-30" size={56} />
                      <h4 className="font-display font-semibold text-slate-400 text-sm">Ningún prospecto seleccionado</h4>
                      <p className="text-xs text-slate-600 mt-1 max-w-xs">Selecciona un lead de la lista de la izquierda para ver su información y chatear de forma interactiva.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 5: REPORTES ANALÍTICOS */}
            {activeTab === "reportes" && (
              <div className="p-6 space-y-6 animate-slide-up">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-display text-2xl font-semibold text-white tracking-tight">Reportes de Conversión</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Analiza el rendimiento del agente de prospección con IA.</p>
                  </div>

                  <div className="flex bg-[#142036] border border-[#1e2d44] rounded-xl p-0.5 text-xs font-mono">
                    <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">Últimos 12 Días</span>
                  </div>
                </div>

                {/* KPI block Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: "Tasa de Cierre Global", value: `${conversionRate}%`, desc: "Inicios a Cita Agendada", color: "text-[#00C8F0]" },
                    { label: "Ratio Respuestas", value: `${replyRate}%`, desc: "Interés inicial sobre envíos", color: "text-purple-400" },
                    { label: "Citas por cada 1K", value: (totalSent > 0 ? (totalScheduled / totalSent * 1000).toFixed(1) : "0"), desc: "Capacidad de escala", color: "text-emerald-400" },
                    { label: "Citas Agendadas", value: totalScheduled, desc: "Reuniones comerciales cerradas", color: "text-amber-500" }
                  ].map((kpi, idx) => (
                    <div key={idx} className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-4 text-center">
                      <span className="text-[10px] text-slate-500 font-display uppercase tracking-wider font-semibold block">{kpi.label}</span>
                      <p className={`font-display text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-600 block mt-0.5">{kpi.desc}</span>
                    </div>
                  ))}
                </div>

                {/* SVG Comparative Chart of volume per Campaign */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Bar Chart comparing campaigns */}
                  <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
                    <div>
                      <h3 className="font-display font-semibold text-sm text-white">Volumen de Conversión por Campaña</h3>
                      <p className="text-xs text-slate-500">Separado en enviados, respuestas y citas agendadas.</p>
                    </div>

                    <div className="space-y-4 pt-1">
                      {campaigns.map(c => {
                        const targetColor = services.find(s => s.id === c.serviceId)?.color || "#fff";
                        return (
                          <div key={c.id} className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-200">{c.name}</span>
                              <span className="font-mono text-slate-400">{c.scheduled} de {c.messagesSent} ({((c.scheduled / (c.messagesSent || 1)) * 100).toFixed(2)}%)</span>
                            </div>
                            
                            {/* Visual Nested Stacked progress bar representing percentage rates of each campaign */}
                            <div className="h-2.5 bg-[#080c14] rounded-full overflow-hidden flex">
                              <div className="h-full bg-cyan-400" style={{ width: `${Math.min((c.messagesSent / (totalSent || 1)) * 100, 100)}%` }} title="Enviados" />
                              <div className="h-full bg-purple-500" style={{ width: `${Math.min((c.replies / (totalSent || 1)) * 100, 100)}%` }} title="Respuestas" />
                              <div className="h-full" style={{ width: `${Math.min((c.scheduled / (totalSent || 1)) * 100, 100)}%`, background: targetColor }} title="Citas" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Distribution list */}
                  <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-4">
                    <div>
                      <h3 className="font-display font-semibold text-sm text-white">Distribución de Citas por Líneas</h3>
                      <p className="text-xs text-slate-500">Citas agendadas por cada categoría de servicio.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center">
                      {/* Simple stroke donut simulation using SVG dashboard metrics */}
                      <div className="flex justify-center">
                        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#142036" strokeWidth="2.5" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#00C8F0" strokeWidth="2.5" strokeDasharray="60 100" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeDasharray="30 100" strokeDashoffset="-60" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="10 100" strokeDashoffset="-90" />
                        </svg>
                      </div>

                      <div className="space-y-2">
                        {campaigns.map(c => {
                          const srv = services.find(s => s.id === c.serviceId);
                          return (
                            <div key={c.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: srv?.color }} />
                                <span className="text-slate-450 truncate" title={c.name}>{c.name}</span>
                              </div>
                              <span className="font-mono text-slate-200 font-bold shrink-0">{c.scheduled}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historical data listing */}
                <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl p-5 space-y-3">
                  <h3 className="font-display font-semibold text-sm text-white">Consolidado Diario de Conversiones</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[#1e2d44] text-slate-500 font-display font-medium text-left">
                          <th className="py-2.5">Fecha</th>
                          <th className="py-2.5">Enviados</th>
                          <th className="py-2.5">Respuestas</th>
                          <th className="py-2.5">Cualificados</th>
                          <th className="py-2.5 text-center">Citas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2d44]/30">
                        {stats.map(s => (
                          <tr key={s.date} className="hover:bg-[#142036]/20 transition">
                            <td className="py-2 text-slate-400 font-semibold">{s.date}</td>
                            <td className="py-2 text-slate-300">{s.sent.toLocaleString()}</td>
                            <td className="py-2 text-slate-300">{s.replies}</td>
                            <td className="py-2 text-purple-400">{s.qualified}</td>
                            <td className="py-2 text-amber-500 text-center font-bold">{s.scheduled}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 6: CALENDARIO */}
            {activeTab === "calendario" && (
              <CalendarView
                contacts={contacts}
                services={services}
                campaigns={campaigns}
                onGoToContactChat={(contact) => {
                  setSelectedContact(contact);
                  setActiveView("crm");
                }}
                onRefreshData={fetchAllData}
                triggerNotification={triggerActionNotice}
              />
            )}

            {/* VIEW 7: WEBHOOK & SUPABASE SIMULATOR */}
            {activeTab === "webhooks" && (
              <WebhookAndDbView
                services={services}
                campaigns={campaigns}
                accounts={accounts}
                webhookLogs={webhookLogs}
                supabaseConfig={supabaseConfig}
                onFireWebhook={handleFireSimulatedWebhook}
                onClearLogs={handleClearWebhookLogs}
                simulating={simulatingWebhook}
                onGoToCRMContact={(handle) => {
                  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
                  const existing = contacts.find(c => c.handle.toLowerCase() === cleanHandle.toLowerCase() || c.handle.toLowerCase() === handle.toLowerCase());
                  if (existing) {
                    setSelectedContact(existing);
                    setActiveView("crm");
                  } else {
                    triggerActionNotice(`No se encontró un registro CRM para ${handle} de momento.`, "info");
                  }
                }}
                triggerNotification={triggerActionNotice}
              />
            )}

          </div>
        )}
      </div>

      {/* DISPATCH OUTREACH DIALOG / MODAL */}
      {showOutreachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
          <div className="bg-[#0e1422] border border-[#1e2d44] rounded-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-[#1e2d44] flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-white text-base">Lanzar Prospección de Leads</h3>
                <p className="text-xs text-slate-500">Envía primer mensaje según plantilla de campaña.</p>
              </div>
              <button 
                onClick={() => setShowOutreachModal(false)}
                className="p-1 px-2.5 hover:bg-[#1a293d] rounded-lg text-xs"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-display font-medium block">Selecciona la Campaña Activa:</label>
                <select 
                  value={outreachCampaignId}
                  onChange={e => setOutreachCampaignId(e.target.value)}
                  className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2.5 text-xs text-white uppercase font-mono focus:outline-none"
                >
                  <option value="">Selecciona campaña...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.status === "running" ? "Activa" : "Pausada"})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-display font-semibold block flex justify-between">
                  <span>Listado de Handles de Instagram:</span>
                  <span className="text-[10px] text-slate-500 font-normal">Uno por línea, debe incluir el '@'</span>
                </label>
                <textarea 
                  value={outreachHandlesInput}
                  onChange={e => setOutreachCampaignHandles(e.target.value)}
                  rows={5}
                  placeholder={`@cafe_centro\n@burger_king\n@hamburguesas_mx`}
                  className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-xs font-mono leading-relaxed focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              {outreachResultLogs.length > 0 && (
                <div className="bg-[#080c14] border border-[#1e2d44] rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto">
                  <span className="text-[10px] font-mono text-cyan-400 block uppercase font-bold">Bitácora de Resultados:</span>
                  {outreachResultLogs.map((log, idx) => (
                    <div key={idx} className="text-[10px] font-mono text-slate-450 leading-relaxed border-b border-slate-900 last:border-none pb-1">{log}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#1e2d44] bg-[#0c1220]/60 flex gap-2">
              <button 
                onClick={handleLaunchOutreach}
                disabled={outreachLoading}
                className="flex-1 py-2.5 bg-cyan-400 text-[#0e1422] rounded-xl text-xs font-display font-bold hover:bg-cyan-300 disabled:opacity-40 transition flex items-center justify-center gap-1.5 shadow-lg"
              >
                {outreachLoading && <Loader2 className="animate-spin" size={13} />}
                Lanzar Campaña
              </button>
              <button 
                onClick={() => setShowOutreachModal(false)}
                className="px-4 py-2.5 bg-[#142036] border border-[#1e2d44] rounded-xl text-xs font-display text-slate-400"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
