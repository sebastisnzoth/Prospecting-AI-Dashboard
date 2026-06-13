import { Service, IGAccount, Campaign, Contact, DailyStat } from "./types";

export const INITIAL_SERVICES: Service[] = [
  {
    id: "svc-1",
    name: "Gestión de Redes Sociales",
    category: "Marketing Digital",
    avatar: "Dueños de restaurantes, tiendas físicas y clínicas con 1-5 empleados que tienen presencia en Instagram pero no publican con consistencia. Facturan entre $30K-$150K anuales.",
    calendarLink: "https://calendly.com/miagencia/redes-sociales",
    aiPrompt: "Eres un consultor de marketing digital amigable pero profesional. Tu objetivo es agendar una llamada de diagnóstico gratuita de 20 min. Pregunta primero cuántos empleados tiene su negocio, luego si publican actualmente en redes, y finalmente si han considerado delegar esa tarea. Si responde sí a las 3, envía el link del calendario: https://calendly.com/miagencia/redes-sociales. Maneja la objeción de precio con: 'Por eso ofrecemos una sesión de diagnóstico sin costo, para ver si realmente tiene sentido para tu negocio'.",
    color: "#00C8F0",
    createdAt: "2024-11-15"
  },
  {
    id: "svc-2",
    name: "Generación de Leads con IA",
    category: "Automatización",
    avatar: "Agencias de marketing, consultoras B2B y coaches de negocios con equipo de ventas que hacen prospección manual. Buscan escalar sin contratar más SDRs.",
    calendarLink: "https://calendly.com/miagencia/ai-leads",
    aiPrompt: "Eres un especialista en automatización de ventas. Tu tono es técnico y directo. Califica con 3 preguntas: 1) ¿Cuántos leads por mes consigues actualmente? 2) ¿Tu equipo de ventas prospecta manualmente? 3) ¿Cuál es tu ticket promedio? Si el ticket es mayor a $500 y prospectan manualmente, son un lead calificado. Envía el link de agendamiento: https://calendly.com/miagencia/ai-leads. Objeción común: 'Ya probé herramientas así'. Responde: 'Entiendo, ¿cuál fue el principal problema? Lo que hacemos diferente es personalización en tiempo real'.",
    color: "#8B5CF6",
    createdAt: "2024-12-01"
  },
  {
    id: "svc-3",
    name: "Diseño de Embudos de Venta",
    category: "Marketing Digital",
    avatar: "Infoproductores, coaches y consultores que venden cursos o servicios online. Tienen audiencia pero no convierten bien. Facturan entre $50K-$500K anuales.",
    calendarLink: "https://calendly.com/miagencia/embudos",
    aiPrompt: "Eres un estratega de conversión sumamente analítico. Pregunta: ¿Tienes actualmente una página de ventas? ¿Cuál es tu tasa de conversión aproximada? ¿Has invertido en anuncios (ads)? Si tiene ads pero mala conversión, es un candidato ideal. Resalta que el problema no es el tráfico sino el embudo y ofrece una auditoría técnica gratuita de 30 min agendando aquí: https://calendly.com/miagencia/embudos.",
    color: "#F59E0B",
    createdAt: "2025-01-10"
  }
];

export const INITIAL_ACCOUNTS: IGAccount[] = [
  { id: "acc-1", handle: "@mkt_agencia01", followers: 1240, status: "active", sentToday: 42, limit: 80 },
  { id: "acc-2", handle: "@mkt_agencia02", followers: 890, status: "active", sentToday: 67, limit: 80 },
  { id: "acc-3", handle: "@mkt_agencia03", followers: 2100, status: "active", sentToday: 31, limit: 80 },
  { id: "acc-4", handle: "@mkt_agencia04", followers: 560, status: "limited", sentToday: 80, limit: 80 },
  { id: "acc-5", handle: "@agencia_boost01", followers: 1780, status: "active", sentToday: 55, limit: 80 },
  { id: "acc-6", handle: "@agencia_boost02", followers: 920, status: "active", sentToday: 29, limit: 80 },
  { id: "acc-7", handle: "@leads_pro01", followers: 445, status: "active", sentToday: 61, limit: 80 },
  { id: "acc-8", handle: "@leads_pro02", followers: 1120, status: "banned", sentToday: 0, limit: 0 }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "camp-1",
    name: "Restaurantes LATAM Q1",
    serviceId: "svc-1",
    status: "running",
    accounts: ["acc-1", "acc-2", "acc-3"],
    messagesSent: 4821,
    replies: 687,
    qualified: 143,
    scheduled: 31,
    initialMessage: "Hola [nombre]! Vi tu negocio en Instagram y me pareció increíble lo que hacés con [tipo_negocio]. Trabajo con dueños como vos ayudándolos a crecer en redes sin que tengan que dedicarle tiempo. ¿Te interesaría saber cómo? 🚀",
    startDate: "2025-01-08",
    lastActive: "hace 2 min",
    follow_up_enabled: true,
    follow_up_delay_hours: 24,
    follow_up_max_count: 3
  },
  {
    id: "camp-2",
    name: "Agencias B2B - Automatización",
    serviceId: "svc-2",
    status: "running",
    accounts: ["acc-5", "acc-6"],
    messagesSent: 2140,
    replies: 389,
    qualified: 94,
    scheduled: 22,
    initialMessage: "¿Tu equipo todavía prospecta manualmente en LinkedIn o Instagram? Tengo un sistema de IA que genera leads calificados mientras dormís. ¿Vale la pena contarte en 30 segundos cómo funciona?",
    startDate: "2025-01-15",
    lastActive: "hace 8 min",
    follow_up_enabled: true,
    follow_up_delay_hours: 24,
    follow_up_max_count: 3
  },
  {
    id: "camp-3",
    name: "Coaches & Infoproductores",
    serviceId: "svc-3",
    status: "paused",
    accounts: ["acc-7"],
    messagesSent: 1203,
    replies: 201,
    qualified: 38,
    scheduled: 9,
    initialMessage: "Hola! Sigo tu contenido desde hace un tiempo y noto que tenés mucho valor para dar. ¿Alguna vez calculaste cuánto estás dejando de ganar por no tener un embudo de ventas optimizado?",
    startDate: "2024-12-20",
    lastActive: "hace 3 días",
    follow_up_enabled: false,
    follow_up_delay_hours: 48,
    follow_up_max_count: 2
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: "con-1",
    handle: "@pizzeria_renzo",
    name: "Carlos Renzo",
    businessType: "Pizzería",
    campaignId: "camp-1",
    serviceId: "svc-1",
    status: "scheduled",
    notes: "Dueño de 2 sucursales. Interesado en gestión completa de Instagram y TikTok.",
    createdAt: "2025-01-22",
    lastContact: "hace 1 hora",
    appointmentDate: "2026-06-18 15:00",
    conv_stage: "done",
    conv_answers: { "q1": "8 empleados", "q2": "Publico irregular yo mismo en mi tiempo libre" },
    conv_summary: "El cliente muestra alto interés pero carece de tiempo. Tiene 8 empleados y publica de manera inconsistente.",
    messages: [
      { id: "m1", sender: "ai", content: "Hola Carlos! Vi tu negocio en Instagram y me pareció increíble lo que hacés con tu pizzería. Trabajo con dueños como vos ayudándolos a crecer en redes sin dedicarle tiempo. ¿Te interesaría saber cómo? 🚀", timestamp: "2025-01-22 10:30" },
      { id: "m2", sender: "prospect", content: "Hola! Sí, la verdad que no tenemos mucho tiempo para el tema redes. ¿De qué se trata?", timestamp: "2025-01-22 11:15" },
      { id: "m3", sender: "ai", content: "Genial! Básicamente te manejamos toda la presencia en redes: contenido, publicaciones y engagement. ¿Cuántos empleados tiene tu pizzería?", timestamp: "2025-01-22 11:16" },
      { id: "m4", sender: "prospect", content: "Tenemos como 8 personas entre las dos sucursales", timestamp: "2025-01-22 11:45" },
      { id: "m5", sender: "ai", content: "Perfecto perfil! ¿Actualmente alguien de tu equipo maneja las redes? ¿Con qué frecuencia publican?", timestamp: "2025-01-22 11:46" },
      { id: "m6", sender: "prospect", content: "La verdad casi nada, a veces yo mismo subo algo pero muy irregular", timestamp: "2025-01-22 12:10" },
      { id: "m7", sender: "ai", content: "Eso es exactamente lo que resolvemos. Te agendo una llamada de 20 min donde te mostramos resultados reales de negocios similares. Reserva aquí tu espacio: https://calendly.com/miagencia/redes-sociales", timestamp: "2025-01-22 12:11" },
      { id: "m8", sender: "prospect", content: "¡Excelente! Ya agendé para el martes 28.", timestamp: "2025-01-22 13:00" }
    ]
  },
  {
    id: "con-2",
    handle: "@clinica_belleza_mx",
    name: "María Fuentes",
    businessType: "Clínica Estética",
    campaignId: "camp-1",
    serviceId: "svc-1",
    status: "qualified",
    notes: "Tiene presupuesto. Dudas sobre si el equipo puede mantener el tono de su marca.",
    createdAt: "2025-01-23",
    lastContact: "hace 30 min",
    conv_stage: "q1",
    conv_answers: { "q1": "4 personas" },
    conv_summary: "María es dueña de una clínica estética con 4 colaboradores. Tiene mucho interés y está calificada.",
    messages: [
      { id: "m1", sender: "ai", content: "Hola María! Vi tu clínica estética en Instagram y me pareció increíble el trabajo que hacen. ¿Te interesaría saber cómo podrían tener más clientes a través de redes sin dedicarle tiempo? 🚀", timestamp: "2025-01-23 09:00" },
      { id: "m2", sender: "prospect", content: "Sí me interesa, cuéntame más", timestamp: "2025-01-23 09:45" },
      { id: "m3", sender: "ai", content: "¡Perfecto! Gestionamos toda tu presencia digital para que atraigas pacientes consistentemente. ¿Cuántos empleados tiene tu clínica actualmente?", timestamp: "2025-01-23 09:46" },
      { id: "m4", sender: "prospect", content: "Somos un equipo pequeño de 4 personas", timestamp: "2025-01-23 10:15" }
    ]
  },
  {
    id: "con-3",
    handle: "@scaleleads_co",
    name: "Diego Montoya",
    businessType: "Agencia de Marketing",
    campaignId: "camp-2",
    serviceId: "svc-2",
    status: "scheduled",
    notes: "Agencia de 6 personas. Prospectan 200 leads/mes manualmente. Ticket promedio $800.",
    createdAt: "2025-01-21",
    lastContact: "hace 2 horas",
    appointmentDate: "2026-06-15 10:00",
    conv_stage: "done",
    conv_answers: { "q1": "200 leads/mes", "q2": "Sí, prospectamos manual en IG y Linkedin", "q3": "$800 USD" },
    conv_summary: "Diego es calificado: ticket promedio $800 y prospección altamente manual con 6 personas.",
    messages: [
      { id: "m1", sender: "ai", content: "¿Tu equipo todavía prospecta manualmente? Tengo un sistema de IA que genera leads calificados mientras dormís. ¿Vale la pena contarte en 30 segundos cómo funciona?", timestamp: "2025-01-21 14:00" },
      { id: "m2", sender: "prospect", content: "Jaja sí, estamos ahogados prospectando de forma manual todo el día. Cuéntame", timestamp: "2025-01-21 15:30" },
      { id: "m3", sender: "ai", content: "Te entiendo perfectamente. Para ver si la IA puede automatizar tu pipeline, ¿cuántos prospectos contactan al mes y cuál es tu ticket promedio?", timestamp: "2025-01-21 15:32" },
      { id: "m4", sender: "prospect", content: "Contactamos unos 200 al mes y nuestro servicio promedio sale en $800 dólares.", timestamp: "2025-01-21 15:58" },
      { id: "m5", sender: "ai", content: "¡Excelente! Definitivamente estás perdiendo cientos de horas. Nuestro agente AI califica automáticamente como lo estoy haciendo ahora. Te dejo el link para agendar una demostración de 15 min donde te muestro plantillas listas para agencias: https://calendly.com/miagencia/ai-leads", timestamp: "2025-01-21 16:00" },
      { id: "m6", sender: "prospect", content: "Perfecto! Ya agendé para el 15.", timestamp: "2025-01-21 16:15" }
    ]
  },
  {
    id: "con-4",
    handle: "@tienda_moda_paula",
    name: "Paula Sánchez",
    businessType: "E-commerce Moda",
    campaignId: "camp-1",
    serviceId: "svc-1",
    status: "lost",
    notes: "Ya tiene una persona interna para redes. No es el momento.",
    createdAt: "2025-01-20",
    lastContact: "hace 4 días",
    conv_stage: "lost",
    messages: [
      { id: "m1", sender: "ai", content: "Hola Paula! Vi tu tienda de moda en Instagram y me pareció increíble tu última colección. Trabajo con dueñas de marcas como vos liberándolas de la carga de crear contenido. ¿Te interesaría delegar tus posts? 🚀", timestamp: "2025-01-20 11:00" },
      { id: "m2", sender: "prospect", content: "Gracias, pero ya tenemos una chica contratada interna que nos maneja de manera exclusiva las redes.", timestamp: "2025-01-20 16:00" }
    ]
  },
  {
    id: "con-5",
    handle: "@coach_finanzas_ar",
    name: "Roberto Díaz",
    businessType: "Coach de Finanzas",
    campaignId: "camp-3",
    serviceId: "svc-3",
    status: "contacted",
    notes: "Respondió con interés pero no ha contestado el seguimiento.",
    createdAt: "2025-01-19",
    lastContact: "hace 5 días",
    conv_stage: "intro",
    messages: [
      { id: "m1", sender: "ai", content: "Hola! Sigo tu contenido desde hace un tiempo y noto que tenés mucho valor para dar. ¿Alguna vez calculaste cuánto estás dejando de ganar por no tener un embudo de ventas optimizado?", timestamp: "2025-01-19 10:00" },
      { id: "m2", sender: "prospect", content: "Mmm nunca lo pensé así. ¿A qué te referís exactamente con embudo?", timestamp: "2025-01-19 18:00" },
      { id: "m3", sender: "ai", content: "Te explico: un embudo guía a tus seguidores desde tu reel hasta una videollamada de venta sin fricción, automatizando la cualificación. ¿Tienes actualmente alguna página donde vendas tus mentorías o cursos?", timestamp: "2025-01-19 18:01" }
    ]
  }
];

export const INITIAL_DAILY_STATS: DailyStat[] = [
  { date: "Ene 16", sent: 580, replies: 72, qualified: 18, scheduled: 4 },
  { date: "Ene 17", sent: 620, replies: 89, qualified: 21, scheduled: 6 },
  { date: "Ene 18", sent: 490, replies: 61, qualified: 15, scheduled: 3 },
  { date: "Ene 19", sent: 720, replies: 105, qualified: 28, scheduled: 7 },
  { date: "Ene 20", sent: 680, replies: 98, qualified: 24, scheduled: 5 },
  { date: "Ene 21", sent: 810, replies: 121, qualified: 31, scheduled: 9 },
  { date: "Ene 22", sent: 750, replies: 113, qualified: 27, scheduled: 8 },
  { date: "Ene 23", sent: 870, replies: 134, qualified: 36, scheduled: 11 },
  { date: "Ene 24", sent: 920, replies: 148, qualified: 40, scheduled: 12 },
  { date: "Ene 25", sent: 855, replies: 130, qualified: 33, scheduled: 10 },
  { date: "Ene 26", sent: 940, replies: 159, qualified: 44, scheduled: 14 },
  { date: "Ene 27", sent: 1020, replies: 172, qualified: 48, scheduled: 16 }
];
