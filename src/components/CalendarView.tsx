import React, { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Contact, Service, Campaign } from "../types";
import { 
  X, 
  Calendar, 
  User, 
  Instagram, 
  Clock, 
  Briefcase, 
  Tag, 
  FileText, 
  MessageSquare,
  ArrowRight,
  Filter,
  Users,
  CheckCircle,
  AlertTriangle,
  Plus,
  Compass,
  ChevronRight,
  Sparkles,
  Inbox
} from "lucide-react";

interface CalendarViewProps {
  contacts: Contact[];
  services: Service[];
  campaigns: Campaign[];
  onGoToContactChat: (contact: Contact) => void;
  onRefreshData: () => Promise<void>;
  triggerNotification: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function CalendarView({
  contacts,
  services,
  campaigns,
  onGoToContactChat,
  onRefreshData,
  triggerNotification
}: CalendarViewProps) {
  // Calendar Active Filters
  const [selectedServiceId, setSelectedServiceId] = useState<string>("all");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");

  // Selection states for detail modal
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [contactNotes, setContactNotes] = useState<string>("");

  // Schedule simulator states
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("10:00");
  const [scheduleContactId, setScheduleContactId] = useState<string>("");
  const [scheduleSearch, setScheduleSearch] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  // Filter contacts by Service & Campaign that are scheduled
  const filteredAppointments = useMemo(() => {
    return contacts.filter(contact => {
      if (contact.status !== "scheduled" || !contact.appointmentDate) return false;
      const matchesService = selectedServiceId === "all" || contact.serviceId === selectedServiceId;
      const matchesCampaign = selectedCampaignId === "all" || contact.campaignId === selectedCampaignId;
      return matchesService && matchesCampaign;
    });
  }, [contacts, selectedServiceId, selectedCampaignId]);

  // Map Filtered appointments for FullCalendar Events list
  const calendarEvents = useMemo(() => {
    return filteredAppointments.map(contact => {
      const service = services.find(s => s.id === contact.serviceId);
      const campaign = campaigns.find(c => c.id === contact.campaignId);
      const startStr = contact.appointmentDate ? contact.appointmentDate.trim().replace(" ", "T") : "";
      
      // Calculate display title: " Carlos Renzo (@pizza) "
      const title = `${contact.name} (${contact.handle})`;
      
      return {
        id: contact.id,
        title: title,
        start: startStr,
        // Make the end time 45 mins after start for timeGrid view visually
        end: startStr ? new Date(new Date(startStr).getTime() + 45 * 60 * 1000).toISOString() : undefined,
        backgroundColor: service?.color || "#00C8F0",
        borderColor: service?.color || "#00C8F0",
        textColor: "#080c14",
        extendedProps: {
          contact,
          service,
          campaign
        }
      };
    });
  }, [filteredAppointments, services, campaigns]);

  // Click on Calendar appointment event handler
  const handleEventClick = (info: any) => {
    const contact = info.event.extendedProps.contact as Contact;
    setDetailContact(contact);
    setContactNotes(contact.notes || "");
  };

  // Click on Calendar empty date cell handler
  const handleDateClick = (info: any) => {
    setScheduleDate(info.dateStr);
    setScheduleTime("10:00");
    setScheduleContactId("");
    setScheduleSearch("");
    setShowScheduleModal(true);
  };

  // Handle saving customer notes inside the detail view
  const handleSaveNotes = async () => {
    if (!detailContact) return;
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/contacts/${detailContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: contactNotes })
      });
      if (!response.ok) throw new Error("Failed to save operational notes.");
      
      triggerNotification("Notas guardadas correctamente", "success");
      // Update local detailed contact state
      setDetailContact(prev => prev ? { ...prev, notes: contactNotes } : null);
      await onRefreshData();
    } catch (e: any) {
      triggerNotification(e.message || "Error al actualizar notas.", "error");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Filter contacts eligible for new schedule scheduling (all contacts in system)
  const eligibleContacts = useMemo(() => {
    return contacts.filter(c => {
      const term = scheduleSearch.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(term) ||
        c.handle.toLowerCase().includes(term) ||
        c.businessType.toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [contacts, scheduleSearch]);

  // Handle scheduling a manual event
  const handleCreateAppointment = async () => {
    if (!scheduleContactId) {
      triggerNotification("Por favor selecciona un prospecto de la lista.", "error");
      return;
    }
    const selectedC = contacts.find(c => c.id === scheduleContactId);
    if (!selectedC) return;

    setIsScheduling(true);
    const appointmentFormatted = `${scheduleDate} ${scheduleTime}`;

    try {
      const response = await fetch(`/api/contacts/${scheduleContactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "scheduled",
          appointmentDate: appointmentFormatted,
          conv_stage: "done"
        })
      });
      if (!response.ok) throw new Error("Fallo en la creación de cita en la base de datos.");

      triggerNotification(`¡Cita agendada para ${selectedC.name}!`, "success");
      setShowScheduleModal(false);
      await onRefreshData();
    } catch (e: any) {
      triggerNotification(e.message || "Error al agendar cita manual.", "error");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-slide-up bg-[#080c14] h-full flex flex-col overflow-hidden">
      
      {/* Top Controls Headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Calendar className="text-[#00C8F0] stroke-[2.2]" size={24} />
            Calendario de Citas
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Controla las videollamadas de diagnóstico cerradas por Claude Haiku.</p>
        </div>

        {/* Filters Selects */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#0e1422] px-3 py-1.5 rounded-xl border border-[#1e2d44]">
            <Filter size={12} className="text-slate-500" />
            <span className="text-[10px] font-mono uppercase text-slate-400">Servicio:</span>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0e1422]">Todos los servicios</option>
              {services.map(s => (
                <option key={s.id} value={s.id} className="bg-[#0e1422]">{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0e1422] px-3 py-1.5 rounded-xl border border-[#1e2d44]">
            <Compass size={12} className="text-slate-500" />
            <span className="text-[10px] font-mono uppercase text-slate-400">Campaña:</span>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0e1422]">Todas las campañas</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0e1422]">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Quick Info text */}
          <div className="text-xs text-slate-400 font-mono bg-[#142036] px-3 py-1.5 border border-[#1e2d44] rounded-xl">
            Total citas: <span className="text-[#00C8F0] font-bold">{calendarEvents.length}</span>
          </div>
        </div>
      </div>

      {/* Main FullCalendar container wrapper */}
      <div className="flex-1 min-h-0 bg-[#0e1422] border border-[#1e2d44] rounded-2xl overflow-y-auto p-4 relative custom-fc-wrapper shadow-2xl">
        {/* CSS overrides inside a styled stylesheet tag to guarantee dark theme integration */}
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-fc-wrapper .fc {
            --fc-border-color: rgba(30, 45, 68, 0.45);
            --fc-daygrid-event-dot-width: 8px;
            --fc-event-bg-color: #00C8F0;
            --fc-event-border-color: #00C8F0;
            --fc-page-bg-color: #0e1422;
            --fc-button-bg-color: #142036;
            --fc-button-border-color: #1e2d44;
            --fc-button-hover-bg-color: #1e2d44;
            --fc-button-hover-border-color: #334155;
            --fc-button-active-bg-color: #1e2d44;
            --fc-button-active-border-color: #00C8F0;
            --fc-today-bg-color: rgba(0, 200, 240, 0.05);
            --fc-neutral-bg-color: #0c1220;
            --fc-list-event-hover-bg-color: #142036;
            font-family: inherit;
            height: 100%;
          }
          .custom-fc-wrapper .fc-header-toolbar {
            margin-bottom: 1.25rem !important;
            padding: 0 0.25rem;
          }
          .custom-fc-wrapper .fc-toolbar-title {
            font-size: 1.15rem !important;
            font-weight: 700 !important;
            letter-spacing: -0.025em;
            color: #ffffff;
            font-family: var(--font-sans), system-ui, sans-serif;
          }
          .custom-fc-wrapper .fc-button {
            padding: 0.45rem 0.85rem !important;
            font-size: 0.75rem !important;
            font-weight: 600 !important;
            text-transform: capitalize !important;
            border-radius: 0.75rem !important;
            transition: all 0.2s ease;
            box-shadow: none !important;
          }
          .custom-fc-wrapper .fc-button-group {
            border-radius: 0.75rem !important;
            gap: 2px;
          }
          .custom-fc-wrapper .fc-button-primary:not(:disabled).fc-button-active,
          .custom-fc-wrapper .fc-button-primary:not(:disabled):active {
            background-color: #00C8F0 !important;
            border-color: #00C8F0 !important;
            color: #080c14 !important;
          }
          .custom-fc-wrapper .fc-col-header-cell-cushion {
            font-size: 0.75rem !important;
            font-weight: 600 !important;
            color: #94a3b8 !important;
            padding: 8px 0 !important;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .custom-fc-wrapper .fc-daygrid-day-number {
            font-size: 0.8rem !important;
            font-family: monospace;
            color: #cbd5e1 !important;
            padding: 6px 8px !important;
          }
          .custom-fc-wrapper .fc-day-other .fc-daygrid-day-number {
            color: #475569 !important;
          }
          .custom-fc-wrapper .fc-event {
            border-radius: 6px !important;
            padding: 2px 6px !important;
            font-size: 0.72rem !important;
            font-weight: 600 !important;
            margin: 1px 2px !important;
            cursor: pointer !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            transition: transform 0.15s ease, filter 0.15s ease;
          }
          .custom-fc-wrapper .fc-event:hover {
            transform: scale(1.025);
            filter: brightness(1.1);
          }
          .custom-fc-wrapper .fc-daygrid-day {
            transition: background-color 0.15s ease;
            cursor: pointer;
          }
          .custom-fc-wrapper .fc-daygrid-day:hover {
            background-color: rgba(255, 255, 255, 0.02);
          }
          .custom-fc-wrapper .fc-timegrid-slot {
            height: 38px !important;
          }
          .custom-fc-wrapper .fc-timegrid-slot-label-cushion {
            font-size: 0.7rem !important;
            font-family: monospace;
            color: #94a3b8 !important;
          }
          .custom-fc-wrapper .fc-theme-standard td, 
          .custom-fc-wrapper .fc-theme-standard th {
            border-color: rgba(30, 45, 68, 0.4) !important;
          }
        ` }} />

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día"
          }}
          allDaySlot={false}
          dayMaxEvents={3}
          locale="es"
          firstDay={1} // Monday first
        />
      </div>

      {/* MODAL 1: APPOINTMENT DETAILS */}
      {detailContact && (
        <div className="fixed inset-0 bg-[#04060b]/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#0e1422] border border-[#1e2d44] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
            
            {/* Header detail */}
            <div className="px-6 py-4 border-b border-[#1e2d44] flex items-center justify-between bg-[#142036]/60">
              <div className="flex items-center gap-2">
                <Calendar className="text-amber-400" size={18} />
                <h3 className="font-display font-semibold text-sm text-white">Detalles del Agendamiento</h3>
              </div>
              <button 
                onClick={() => setDetailContact(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/40 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content body detail */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Contact Main Info Row */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#142036] flex items-center justify-center border border-[#1e2d44] text-cyan-400 shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg text-white leading-tight">{detailContact.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-450 font-mono mt-0.5">
                    <span className="flex items-center gap-0.5 text-cyan-400">
                      <Instagram size={12} />
                      {detailContact.handle}
                    </span>
                    <span>·</span>
                    <span>{detailContact.isNewContact ? "Nuevo" : detailContact.businessType}</span>
                  </div>
                </div>
              </div>

              {/* Grid with Service & Time info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Appointment hour */}
                <div className="p-3 bg-[#080c14] border border-[#1e2d44]/70 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 flex items-center gap-1">
                    <Clock size={11} className="text-amber-400" />
                    Fecha y Hora agendada
                  </span>
                  <p className="text-sm font-semibold text-white pl-4 font-mono">{detailContact.appointmentDate || "Falta confirmar"}</p>
                </div>

                {/* Service Tag */}
                <div className="p-3 bg-[#080c14] border border-[#1e2d44]/70 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 flex items-center gap-1">
                    <Briefcase size={11} className="text-[#00C8F0]" />
                    Servicio de Interés
                  </span>
                  <p className="text-sm font-semibold text-white pl-4 truncate">
                    {services.find(s => s.id === detailContact.serviceId)?.name || "Sin asociar"}
                  </p>
                </div>

                {/* Campaign Tag */}
                <div className="p-3 bg-[#080c14] border border-[#1e2d44]/70 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 flex items-center gap-1">
                    <Tag size={11} className="text-purple-400" />
                    Campaña Origen
                  </span>
                  <p className="text-xs font-semibold text-white pl-4 truncate">
                    {campaigns.find(c => c.id === detailContact.campaignId)?.name || "Outreach directo"}
                  </p>
                </div>

                {/* AI Stage qualification */}
                <div className="p-3 bg-[#080c14] border border-[#1e2d44]/70 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 flex items-center gap-1">
                    <CheckCircle size={11} className="text-emerald-400" />
                    Calificación IA
                  </span>
                  <p className="text-xs font-semibold text-emerald-400 pl-4 capitalize font-mono">
                    {detailContact.conv_stage || "Completado"} (Lead calificado)
                  </p>
                </div>

              </div>

              {/* Answers & Summary */}
              <div className="space-y-3">
                {detailContact.conv_answers && Object.keys(detailContact.conv_answers).length > 0 && (
                  <div className="p-4 bg-[#142036]/40 border border-[#1e2d44] rounded-xl space-y-2">
                    <span className="text-[10px] font-display font-medium text-slate-400 uppercase tracking-wide block">Respuestas claves extraídas:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(detailContact.conv_answers).map(([q, ans]) => (
                        <div key={q} className="bg-[#080c14]/60 px-3 py-1.5 rounded-lg border border-slate-800">
                          <span className="text-slate-500 font-mono text-[9px] block uppercase">{q}:</span>
                          <span className="text-slate-200 mt-0.5 block font-medium">{ans}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detailContact.conv_summary && (
                  <div className="p-4 bg-[#142036]/40 border border-[#1e2d44] rounded-xl space-y-1.5">
                    <span className="text-[10px] font-display font-medium text-slate-400 uppercase tracking-wide block">Resumen de la IA:</span>
                    <p className="text-xs leading-relaxed text-slate-300 italic">" {detailContact.conv_summary} "</p>
                  </div>
                )}
              </div>

              {/* Operator Editable notes */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-display font-semibold block">Notas del Operador (Seguimiento comercial):</span>
                <textarea
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="Añade coordenadas de la llamada, objeciones especiales, etc. (Se guarda en la DB )..."
                  rows={3}
                  className="w-full bg-[#142036]/70 border border-[#1e2d44] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition resize-none leading-relaxed"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || contactNotes === (detailContact.notes || "")}
                  className="px-3.5 py-1.5 bg-[#142036] hover:bg-slate-800 border border-[#1e2d44] text-[10px] font-mono font-medium rounded-lg text-slate-300 hover:text-white disabled:opacity-40 flex items-center gap-1.5 transition ml-auto"
                >
                  {isSavingNotes ? "Guardando..." : "Guardar Notas en Lead"}
                </button>
              </div>

            </div>

            {/* Footer chat links */}
            <div className="p-5 border-t border-[#1e2d44] bg-[#0c1220] flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">ID: {detailContact.id}</span>
              
              <button
                onClick={() => {
                  setDetailContact(null);
                  onGoToContactChat(detailContact);
                }}
                className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl text-xs font-display font-bold hover:shadow-cyan/10 transition hover:scale-[1.02] duration-200"
              >
                Ir a Chat de Instagram <ChevronRight size={13} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL APPOINTMENT CREATOR */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-[#04060b]/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#0e1422] border border-[#1e2d44] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            
            <div className="px-6 py-4 border-b border-[#1e2d44] flex items-center justify-between bg-[#142036]/60">
              <div className="flex items-center gap-2">
                <Plus className="text-cyan-400" size={18} />
                <h3 className="font-display font-semibold text-sm text-white">Nuevo Agendamiento Manual</h3>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/40 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Step 1: Select date summary info */}
              <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400">Fecha seleccionada:</span>
                <span className="font-mono text-cyan-400 font-bold bg-[#142036] px-2.5 py-1 rounded-lg border border-[#1e2d44]">
                  {scheduleDate}
                </span>
              </div>

              {/* Time Selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-display font-medium">Hora de Cita:</label>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-500 font-bold" />
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-400 font-mono cursor-pointer"
                  />
                </div>
              </div>

              {/* Step 2: Search Contact */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-display font-medium flex justify-between items-center">
                  <span>Asignar a Prospecto:</span>
                  {scheduleContactId && (
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">✓ Prospecto seleccionado</span>
                  )}
                </label>
                
                {/* Search box */}
                <input
                  type="text"
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  placeholder="Escribe para buscar lead (ej: Carlos, pizzeria...)"
                  className="w-full bg-[#142036] border border-[#1e2d44] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-cyan-400 transition"
                />

                {/* Contact list for selection */}
                <div className="border border-[#1e2d44] rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800/60 bg-[#080c14]/40">
                  {eligibleContacts.map(c => {
                    const isSelected = scheduleContactId === c.id;
                    const hasAppt = c.status === "scheduled";
                    
                    return (
                      <div
                        key={c.id}
                        onClick={() => setScheduleContactId(c.id)}
                        className={`p-3 cursor-pointer text-xs transition-colors flex items-center justify-between ${
                          isSelected ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-[#142036]/50 text-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-white text-sm">{c.name}</p>
                          <p className="font-mono text-slate-500 text-[10px]">{c.handle} · {c.businessType}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1 shrink-0">
                          {hasAppt ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                              Tiene cita
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full">
                              Ninguna cita
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {eligibleContacts.length === 0 && (
                    <div className="p-6 text-center text-slate-500">
                      No se encontraron contactos elegibles.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer manual save */}
            <div className="p-5 border-t border-[#1e2d44] bg-[#0c1220] flex gap-2">
              <button
                onClick={handleCreateAppointment}
                disabled={isScheduling || !scheduleContactId}
                className="flex-1 py-2.5 bg-cyan-500 text-[#090c14] hover:bg-cyan-400 rounded-xl text-xs font-display font-bold disabled:opacity-40 transition flex items-center justify-center gap-1.5"
              >
                {isScheduling ? "Creando..." : "Confirmar Cita e Insertar"}
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2.5 bg-[#142036] border border-[#1e2d44] rounded-xl text-xs font-display text-slate-400 hover:bg-[#1e2d44] transition"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
