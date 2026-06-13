import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { INITIAL_SERVICES, INITIAL_ACCOUNTS, INITIAL_CAMPAIGNS, INITIAL_CONTACTS, INITIAL_DAILY_STATS } from "./src/data";
import { Service, IGAccount, Campaign, Contact, DailyStat, Message, WebhookEvent } from "./src/types";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Supabase Client if env vars are present
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ftyvtfnvechetczhcbfe.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log(`[Supabase Engine] Connected to project at ${SUPABASE_URL}`);
  } catch (error) {
    console.error("[Supabase Engine] Failed to initialize Supabase client:", error);
  }
} else {
  console.log(`[Supabase Engine] No SUPABASE_ANON_KEY provided. Running in high-performance local sandbox mode.`);
}

// Initialize GoogleGenAI client lazy to avoid startup crash if apiKey is missing
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Persistent Store Path
const STORE_PATH = path.join(process.cwd(), "data-store.json");

interface DataStore {
  services: Service[];
  accounts: IGAccount[];
  campaigns: Campaign[];
  contacts: Contact[];
  stats: DailyStat[];
  webhookEvents?: WebhookEvent[];
}

// Load or Initialize Data Store
function getStore(): DataStore {
  let store: DataStore;
  if (fs.existsSync(STORE_PATH)) {
    try {
      store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    } catch (e) {
      console.error("Failed to parse store file, resetting to defaults", e);
      store = {
        services: INITIAL_SERVICES,
        accounts: INITIAL_ACCOUNTS,
        campaigns: INITIAL_CAMPAIGNS,
        contacts: INITIAL_CONTACTS,
        stats: INITIAL_DAILY_STATS
      };
    }
  } else {
    store = {
      services: INITIAL_SERVICES,
      accounts: INITIAL_ACCOUNTS,
      campaigns: INITIAL_CAMPAIGNS,
      contacts: INITIAL_CONTACTS,
      stats: INITIAL_DAILY_STATS
    };
  }

  if (!store.webhookEvents) {
    store.webhookEvents = [];
  }
  
  saveStore(store);
  return store;
}

function saveStore(store: DataStore) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

// Ensure the application has an endpoint to check backend health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// GET all data
app.get("/api/store", (req, res) => {
  res.json(getStore());
});

// --- Services CRUD ---
app.get("/api/services", (req, res) => {
  res.json(getStore().services);
});

app.post("/api/services", (req, res) => {
  const store = getStore();
  const newService: Service = {
    ...req.body,
    id: req.body.id || `svc-${Date.now()}`,
    createdAt: req.body.createdAt || new Date().toISOString().split("T")[0]
  };
  store.services.push(newService);
  saveStore(store);
  res.json({ success: true, service: newService });
});

app.put("/api/services/:id", (req, res) => {
  const store = getStore();
  store.services = store.services.map(s => s.id === req.params.id ? { ...s, ...req.body } : s);
  saveStore(store);
  res.json({ success: true });
});

app.delete("/api/services/:id", (req, res) => {
  const store = getStore();
  store.services = store.services.filter(s => s.id !== req.params.id);
  saveStore(store);
  res.json({ success: true });
});

// --- Campaigns CRUD ---
app.get("/api/campaigns", (req, res) => {
  res.json(getStore().campaigns);
});

app.post("/api/campaigns", (req, res) => {
  const store = getStore();
  const newCampaign: Campaign = {
    ...req.body,
    id: req.body.id || `camp-${Date.now()}`,
    messagesSent: 0,
    replies: 0,
    qualified: 0,
    scheduled: 0,
    startDate: new Date().toISOString().split("T")[0],
    lastActive: "Justo ahora"
  };
  store.campaigns.push(newCampaign);
  saveStore(store);
  res.json({ success: true, campaign: newCampaign });
});

app.put("/api/campaigns/:id", (req, res) => {
  const store = getStore();
  store.campaigns = store.campaigns.map(c => c.id === req.params.id ? { ...c, ...req.body } : c);
  saveStore(store);
  res.json({ success: true });
});

app.post("/api/campaigns/:id/toggle", (req, res) => {
  const store = getStore();
  store.campaigns = store.campaigns.map(c => {
    if (c.id === req.params.id) {
      const nextStatus = c.status === "running" ? "paused" : "running";
      return { ...c, status: nextStatus, lastActive: "Justo ahora" };
    }
    return c;
  });
  saveStore(store);
  res.json({ success: true });
});

// --- Satellite Accounts ---
app.get("/api/accounts", (req, res) => {
  res.json(getStore().accounts);
});

app.post("/api/accounts", (req, res) => {
  const store = getStore();
  const index = store.accounts.findIndex(a => a.id === req.body.id);
  if (index !== -1) {
    store.accounts[index] = { ...store.accounts[index], ...req.body };
  } else {
    store.accounts.push({
      ...req.body,
      id: req.body.id || `acc-${Date.now()}`
    });
  }
  saveStore(store);
  res.json({ success: true });
});

// --- CRM Contacts ---
app.get("/api/contacts", (req, res) => {
  res.json(getStore().contacts);
});

app.post("/api/contacts", (req, res) => {
  const store = getStore();
  const newContact: Contact = {
    ...req.body,
    id: req.body.id || `con-${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
    lastContact: "Justo ahora",
    messages: req.body.messages || []
  };
  store.contacts.push(newContact);
  saveStore(store);
  res.json({ success: true, contact: newContact });
});

app.put("/api/contacts/bulk-status", (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) {
    return res.status(400).json({ success: false, error: "Invalid payload" });
  }
  const store = getStore();
  store.contacts = store.contacts.map(c => ids.includes(c.id) ? { ...c, status } : c);
  saveStore(store);
  res.json({ success: true });
});

app.put("/api/contacts/:id", (req, res) => {
  const store = getStore();
  store.contacts = store.contacts.map(c => c.id === req.params.id ? { ...c, ...req.body } : c);
  saveStore(store);
  res.json({ success: true });
});


// Helper to update daily statistics
function incrementStats(type: "sent" | "replies" | "qualified" | "scheduled", campaignId: string) {
  const store = getStore();
  const dateStr = "Ene " + new Date().getDate(); // Standardize with mock Ene dates
  
  // Find or create daily stat row
  let stat = store.stats.find(s => s.date === dateStr);
  if (!stat) {
    stat = { date: dateStr, sent: 0, replies: 0, qualified: 0, scheduled: 0 };
    store.stats.push(stat);
  }
  stat[type]++;

  // Increment Campaign totals
  store.campaigns = store.campaigns.map(c => {
    if (c.id === campaignId) {
      return {
        ...c,
        [type === "sent" ? "messagesSent" : type]: c[type === "sent" ? "messagesSent" : type] + 1,
        lastActive: "Justo ahora"
      };
    }
    return c;
  });

  saveStore(store);
}


// --- Edge Function Simulation 1: handle-dm ---
// POST /api/handle-dm - Receives message from Instagram private api poller
app.post("/api/handle-dm", async (req, res) => {
  const { ig_handle, message, account_id, campaign_id } = req.body;
  
  if (!ig_handle || !message) {
    return res.status(400).json({ error: "ig_handle and message are required fields" });
  }

  try {
    const store = getStore();
    
    // Resolve Campaign
    let activeCampaign = store.campaigns.find(c => c.id === campaign_id || c.status === "running");
    if (!activeCampaign) {
      activeCampaign = store.campaigns[0]; // fallback
    }

    // Resolve Service
    const service = store.services.find(s => s.id === activeCampaign!.serviceId) || store.services[0];

    // Find or create contact logs
    let contact = store.contacts.find(c => c.handle.toLowerCase() === ig_handle.toLowerCase() && c.serviceId === service.id);
    const isNewContact = !contact;

    if (!contact) {
      contact = {
        id: `con-${Date.now()}`,
        handle: ig_handle,
        name: ig_handle.replace("@", "").replace("_", " ").replace(/\d+/g, ""),
        businessType: "Negocio Local",
        campaignId: activeCampaign!.id,
        serviceId: service.id,
        status: "new",
        notes: "Contacto creado por respuesta entrante.",
        createdAt: new Date().toISOString().split("T")[0],
        lastContact: "Justo ahora",
        messages: []
      };
      store.contacts.push(contact);
    }

    // Capture prospect's reply in messages
    const prospectMsg: Message = {
      id: `m-pro-${Date.now()}`,
      sender: "prospect",
      content: message,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    contact.messages.push(prospectMsg);
    contact.lastContact = "Justo ahora";

    // Update replies daily stat
    incrementStats("replies", activeCampaign!.id);

    // AI Orchestration: build dense prompt state
    const currentAnswers = contact.conv_answers || {};
    const objHistory = contact.objections || [];
    const recentHistory = contact.messages.slice(-4).map(m => `${m.sender === "ai" ? "Asistente AI" : "Prospecto"}: ${m.content}`).join("\n");

    const systemInstruction = `
Eres un agente clasificador conversacional inteligente de Instagram para el servicio "${service.name}".
Tu propósito final es cualificar prospectos de manera sutil e ingeniosa y lograr que reserven una videollamada usando este link exacto: ${service.calendarLink}.

PROMPT MAESTRO DEL SERVICIO:
---
${service.aiPrompt}
---

Instrucciones de Compresión de Tokens:
No repitas respuestas genéricas. Mira el historial de la conversación y continúa la lógica.
Si el prospecto ya respondió preguntas clave, mantén su estado.

Análisis de la etapa actual:
- Etapa conversacional anterior: ${contact.conv_stage || "intro"}
- Estado actual de respuestas: ${JSON.stringify(currentAnswers)}
- Lista de objeciones conocidas: ${JSON.stringify(objHistory)}

Historial reciente:
${recentHistory}

Responde ÚNICAMENTE con un objeto JSON estructurado que siga el siguiente esquema exacto de TypeScript:
{
  "reply": string (la respuesta a enviar al prospecto en español, conversacional, máximo 200 caracteres para simular chat de instagram),
  "stage": "intro" | "q1" | "q2" | "q3" | "closing" | "done" | "lost" (la fase de conversación detectada),
  "answers": Record<string, string> (mapa acumulativo de respuestas obtenidas a preguntas clave en este turno),
  "objections": string[] (objeciones nuevas detectadas, ej: "precio", "desconfiado", "tiempo", si el cliente opone quejas),
  "status": "new" | "contacted" | "qualified" | "scheduled" | "closed" | "lost"
}
`;

    const ai = getAI();
    let modelToUse: string = "gemini-3.5-flash";
    if (activeCampaign && activeCampaign.aiModel) {
      modelToUse = activeCampaign.aiModel;
    }
    console.log(`[AI Orchestrator] Using model: ${modelToUse} for campaign ${activeCampaign?.name}`);

    console.log(`[AI Orchestrator] Generating response for handle ${ig_handle}`);
    
    // Call Gemini with JSON request format
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: `Prospecto dice: "${message}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

    let aiResult: {
      reply: string;
      stage?: string;
      answers?: Record<string, string>;
      objections?: string[];
      status?: string;
    };

    try {
      aiResult = JSON.parse(response.text || "{}");
    } catch (e) {
      console.warn("Gemini output was not valid JSON, creating raw text fallback:", response.text);
      aiResult = {
        reply: response.text || "¡Excelente! Para coordinar mejor, ¿podrías decirme cuántos empleados tienes?",
        stage: contact.conv_stage || "q1",
        answers: currentAnswers,
        objections: objHistory,
        status: contact.status
      };
    }

    // Save AI response
    const aiMsg: Message = {
      id: `m-ai-${Date.now()}`,
      sender: "ai",
      content: aiResult.reply,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    contact.messages.push(aiMsg);
    
    // Update contact metadata
    contact.conv_stage = (aiResult.stage as any) || contact.conv_stage;
    contact.conv_answers = { ...currentAnswers, ...aiResult.answers };
    contact.objections = Array.from(new Set([...objHistory, ...(aiResult.objections || [])]));
    
    const prevStatus = contact.status;
    contact.status = (aiResult.status as any) || contact.status;

    // Trigger statistics increments upon qualification / scheduling
    if (contact.status === "qualified" && prevStatus !== "qualified") {
      incrementStats("qualified", activeCampaign!.id);
    }
    if (contact.status === "scheduled" && prevStatus !== "scheduled") {
      incrementStats("scheduled", activeCampaign!.id);
      contact.appointmentDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 11) + " 10:00";
    }

    // Commit changes
    const updatedStore = getStore();
    updatedStore.contacts = updatedStore.contacts.map(c => c.id === contact!.id ? contact! : c);

    // Register Webhook Event
    const tokensEstimated = Math.floor(message.length * 0.4 + (aiResult.reply?.length || 0) * 0.5);
    const eventLog: WebhookEvent = {
      id: `wh-${Date.now()}`,
      ig_handle,
      message,
      accountId: account_id || "acc-direct",
      campaignId: activeCampaign.id,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      status: "processed",
      apiResponse: {
        reply: aiResult.reply,
        tokens_used: tokensEstimated,
        stage: contact.conv_stage,
        status: contact.status,
        answers: contact.conv_answers
      }
    };
    if (!updatedStore.webhookEvents) {
      updatedStore.webhookEvents = [];
    }
    updatedStore.webhookEvents.unshift(eventLog);
    // Keep max 150 events
    if (updatedStore.webhookEvents.length > 150) {
      updatedStore.webhookEvents = updatedStore.webhookEvents.slice(0, 150);
    }

    saveStore(updatedStore);

    res.json({
      reply: aiResult.reply,
      tokens_used: tokensEstimated,
      stage: contact.conv_stage,
      contact_id: contact.id,
      status: contact.status,
      answers: contact.conv_answers
    });

  } catch (error: any) {
    console.error("Error handling DM automatization:", error);

    // Log failed webhook event
    try {
      const errStore = getStore();
      const errLog: WebhookEvent = {
        id: `wh-err-${Date.now()}`,
        ig_handle: ig_handle || "desconocido",
        message: message || "vacío",
        accountId: account_id || "acc-direct",
        campaignId: campaign_id || "desconocida",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        status: "failed",
        error: error.message || "Error en el motor de IA o webhook"
      };
      if (!errStore.webhookEvents) errStore.webhookEvents = [];
      errStore.webhookEvents.unshift(errLog);
      saveStore(errStore);
    } catch (logErr) {
      console.error("Failed to log errored webhook event:", logErr);
    }

    res.status(500).json({ error: error.message || "Something went wrong in conversational engine" });
  }
});


// --- Gemini Intelligence API 1: suggest-reply ---
// POST /api/suggest-reply - Operator manually requests an AI recommendation & message rewrite
app.post("/api/suggest-reply", async (req, res) => {
  const { contact_id, custom_instruction, custom_model } = req.body;

  if (!contact_id) {
    return res.status(400).json({ error: "contact_id is required" });
  }

  try {
    const store = getStore();
    const contact = store.contacts.find(c => c.id === contact_id);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    const campaign = store.campaigns.find(c => c.id === contact.campaignId);
    const service = store.services.find(s => s.id === contact.serviceId) || store.services[0];

    // Determine model to use
    let modelToUse = custom_model || "gemini-3.5-flash";
    if (!custom_model && campaign && campaign.aiModel) {
      modelToUse = campaign.aiModel;
    }

    const recentMessages = contact.messages.slice(-6).map(m => `${m.sender === "ai" ? "Asistente AI" : "Prospecto"}: ${m.content}`).join("\n");
    const aiAnswers = contact.conv_answers || {};

    const systemInstruction = `
Eres un asistente experto en prospección y persuasión por mensajería (Instagram Outreach Copilot) para el servicio "${service.name}".
Tu tarea es ayudar al operador humano redactando un mensaje sugerido altamente persuasivo, empático, conversacional y directo en español (máximo 200 caracteres, sin hashtags ni sonar robótico) para enviarle al prospecto.

PROMPT DEL SERVICIO:
${service.aiPrompt}

Criterios de calificación detectados hasta ahora:
${JSON.stringify(aiAnswers)}

Historial de conversación reciente:
${recentMessages || "Aún no hay mensajes previos."}

Instrucción o directiva complementaria del operador: "${custom_instruction || "Sugerir respuesta para continuar la conversación con gracia y sutilmente calificar o cerrar"}"

Genera una respuesta en formato JSON con la siguiente estructura de TypeScript:
{
  "suggested_reply": string (la respuesta propuesta lista para enviar, < 200 caracteres),
  "explainer": string (explicación breve de 1 línea de por qué se sugiere esta respuesta frente a la situación actual)
}
`;

    const ai = getAI();
    console.log(`[AI Copilot] Suggesting reply using model: ${modelToUse} for ${contact.handle}`);

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: `Proponme el siguiente mensaje considerando la directiva del operador humano.`,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    });

    let copilotResult;
    try {
      copilotResult = JSON.parse(response.text || "{}");
    } catch {
      copilotResult = {
        suggested_reply: response.text || "¡Hola! Quería consultar qué te parece si coordinamos una brevísima llamada para mostrarte el potencial.",
        explainer: "Respuesta de respaldo debido a problema de formato."
      };
    }

    res.json(copilotResult);

  } catch (error: any) {
    console.error("Error in suggest-reply copilot:", error);
    res.status(500).json({ error: error.message || "No se pudo generar la recomendación de la IA." });
  }
});


// --- Gemini Intelligence API 2: optimize-template ---
// POST /api/optimize-template - Rewrite messages with persuasive copy
app.post("/api/optimize-template", async (req, res) => {
  const { template, service_name, criteria } = req.body;

  if (!template) {
    return res.status(400).json({ error: "template is required" });
  }

  try {
    const systemInstruction = `
Eres un redactor comercial experto en Outreach e iniciadores de conversación persuasivos para Instagram Direct.
Se te dará un mensaje de outreach inicial para promocionar el servicio: "${service_name || "Servicio General"}".

Tu misión es optimizar este mensaje para maximizar el ratio de respuesta de forma amigable, respetuosa y sutil, que no suene spam ni vendedor molesto.

Normas estrictas:
1. Mantén la longitud corta (menos de 200 caracteres para asegurar que entre excelente como chat directo).
2. Conserva de forma estricta las variables dinámicas de corchete: [nombre], [tipo_negocio], [handle], [fecha_actual] (úsalo de forma integrada de forma similar al original).
3. Responde únicamente con el texto limpio que conformará el mensaje optimizado listo para usar como plantilla. No agregues saludos, explicaciones, ni comillas extra. Solo el mensaje.
${criteria ? `Directriz de optimización del usuario: ${criteria}` : ""}
`;

    const ai = getAI();
    console.log(`[AI Optimizer] Optimizing outreach template...`);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Optimiza el siguiente mensaje:\n"${template}"`,
      config: {
        systemInstruction,
        temperature: 0.8
      }
    });

    const optimized = (response.text || template).trim().replace(/^"/, "").replace(/"$/, "");

    res.json({ optimized });

  } catch (error: any) {
    console.error("Error in optimize-template:", error);
    res.status(500).json({ error: error.message || "Fallo optimizando el mensaje con Gemini" });
  }
});


// --- Edge Function Simulation 2: send-outreach ---
// POST /api/send-outreach - Triggers bulk dispatch of campaign introductory invites
app.post("/api/send-outreach", (req, res) => {
  const { campaign_id, handles } = req.body;

  if (!campaign_id || !Array.isArray(handles)) {
    return res.status(400).json({ error: "campaign_id and handles array are required" });
  }

  const store = getStore();
  const campaign = store.campaigns.find(c => c.id === campaign_id);
  if (!campaign) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  const service = store.services.find(s => s.id === campaign.serviceId) || store.services[0];
  const activeSateliteAccounts = store.accounts.filter(a => campaign.accounts.includes(a.id) && a.status === "active" && a.sentToday < a.limit);
  
  if (activeSateliteAccounts.length === 0) {
    return res.json({ sent: 0, skipped: handles.length, reason: "No active accounts with remaining budget today" });
  }

  let sent = 0;
  let skipped = 0;
  const logs: string[] = [];

  handles.forEach((handle, index) => {
    // Unique check ig_handle + service_id
    const alreadyContacted = store.contacts.some(c => c.handle.toLowerCase() === handle.toLowerCase() && c.serviceId === service.id);
    if (alreadyContacted) {
      skipped++;
      logs.push(`${handle}: Skipped (Already in contact log database)`);
      return;
    }

    // Determine round-robin sender account
    const sender = activeSateliteAccounts[sent % activeSateliteAccounts.length];
    if (!sender) {
      skipped++;
      logs.push(`${handle}: Skipped (Sender accounts limit exhaustion mid-process)`);
      return;
    }

    // Process variables in template message
    let customizedMsg = campaign.initialMessage;
    const cleanHandle = handle.replace("@", "");
    const cleanName = cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1).replace(/\d+/g, "").trim();
    
    // Guesses
    const tipos = ["Restaurant", "Agencia", "E-commerce", "Clínica", "Escuela", "Marca de ropa"];
    const guessedType = tipos[Math.floor(Math.random() * tipos.length)];

    customizedMsg = customizedMsg
      .replace(/\[nombre\]/g, cleanName)
      .replace(/\[tipo_negocio\]/g, guessedType)
      .replace(/\[handle\]/g, handle)
      .replace(/\[fecha_actual\]/g, new Date().toISOString().substring(0, 10));

    // Create CRM contact log
    const newContact: Contact = {
      id: `con-${Date.now()}-${index}`,
      handle: handle,
      name: cleanName,
      businessType: guessedType,
      campaignId: campaign.id,
      serviceId: service.id,
      status: "contacted",
      conv_stage: "intro",
      notes: "Campaña de Prospección inicial.",
      createdAt: new Date().toISOString().split("T")[0],
      lastContact: "Justo ahora",
      messages: [
        {
          id: `m-init-${Date.now()}-${index}`,
          sender: "ai",
          content: customizedMsg,
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
        }
      ]
    };

    store.contacts.push(newContact);
    sender.sentToday++;
    campaign.messagesSent++;
    sent++;

    logs.push(`${handle}: Sent via ${sender.handle}`);
  });

  // Save changes
  saveStore(store);

  // Re-increment daily metric sent volume
  if (sent > 0) {
    const freshStore = getStore();
    const dateStr = "Ene " + new Date().getDate();
    let stat = freshStore.stats.find(s => s.date === dateStr);
    if (!stat) {
      stat = { date: dateStr, sent: 0, replies: 0, qualified: 0, scheduled: 0 };
      freshStore.stats.push(stat);
    }
    stat.sent += sent;
    saveStore(freshStore);
  }

  res.json({
    success: true,
    sent,
    skipped,
    logs
  });
});


// --- Simulated Contact Trigger ---
// POST /api/contacts/:id/simulate - Simulates a reply from a CRM contact in the dashboard simulator
app.post("/api/contacts/:id/simulate", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Simulation message content is empty" });
  }

  const store = getStore();
  const contact = store.contacts.find(c => c.id === req.params.id);
  if (!contact) {
    return res.status(404).json({ error: "Contact not found" });
  }

  // Find active campaign
  const campaign = store.campaigns.find(c => c.id === contact.campaignId) || store.campaigns[0];
  const activeAccount = store.accounts.find(a => campaign.accounts.includes(a.id)) || store.accounts[0];

  // Emulate full-dm hook internally
  console.log(`[Simulator] Proxying Simulated DM for ${contact.handle} -> trigger /api/handle-dm`);
  
  // Directly calling AI or handler logic
  const payload = {
    ig_handle: contact.handle,
    message,
    account_id: activeAccount.id,
    campaign_id: campaign.id
  };

  // Execute handle-dm internally & update
  req.body = payload;
  
  // Re-routing to standard post logic
  return app._router.handle({ method: "POST", url: "/api/handle-dm" } as any, res, () => {});
});


// --- Simulated Cron Trigger /api/follow-up ---
app.post("/api/follow-up", (req, res) => {
  const { dry_run, campaign_id } = req.body;
  const mode = dry_run === true ? "DRY RUN (De prueba)" : "PRODUCCIÓN (Enviaría mensajes)";
  
  const store = getStore();
  let count = 0;
  
  // Find contacted leads with no replies for greater than 24 hours
  const inactiveContacts = store.contacts.filter(c => {
    if (c.status !== "contacted" || c.messages.length !== 1) return false;
    if (campaign_id && c.campaignId !== campaign_id) return false;
    return true; // simulate inactivity condition
  });

  const logs: string[] = [];
  inactiveContacts.forEach(c => {
    count++;
    if (dry_run !== true) {
      // Simulate follow-up message dispatch
      const followUpMsg: Message = {
        id: `m-fup-${Date.now()}-${count}`,
        sender: "ai",
        content: `Hola ${c.name}! ¿Pudiste ver el mensajito que te mandé el otro día? Sé que andás a mil con tu negocio, por eso quería asegurarme de que no se te haya pasado. ¡Saludos!`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 16)
      };
      c.messages.push(followUpMsg);
      c.lastContact = "Justo ahora (Follow-up)";
    }
    logs.push(`${c.handle}: follow-up procesado`);
  });

  if (count > 0 && dry_run !== true) {
    saveStore(store);
  }

  res.json({
    message: `Follow-up cron completado. Modo: ${mode}`,
    processed: count,
    logs
  });
});


// --- Webhook Events Logging & Inspection ---
// GET /api/webhook-events - Retrieve recorded live webhook simulation calls
app.get("/api/webhook-events", (req, res) => {
  const store = getStore();
  res.json(store.webhookEvents || []);
});

// POST /api/webhook-events/clear - Clear simulated hook logs
app.post("/api/webhook-events/clear", (req, res) => {
  const store = getStore();
  store.webhookEvents = [];
  saveStore(store);
  res.json({ success: true, message: "Historial de Webhooks simulados limpiado." });
});

// POST /api/supabase/sync - Pushes local sandbox store into production Supabase DB
app.post("/api/supabase/sync", async (req, res) => {
  if (!supabase) {
    return res.status(400).json({
      success: false,
      message: "El cliente de Supabase no está configurado o conectado. Por favor, asegúrate de proporcionar SUPABASE_ANON_KEY en tu archivo .env"
    });
  }

  const store = getStore();
  const summary: any = {};

  try {
    // 1. Sync Services
    if (store.services && store.services.length > 0) {
      const servicesData = store.services.map(s => ({
        id: s.id,
        name: s.name,
        ai_prompt: s.aiPrompt,
        calendar_url: s.calendarLink,
        avatar: s.avatar || "",
        color: s.color || "#00C8F0",
        created_at: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString()
      }));

      const { error: sError } = await supabase.from("services").upsert(servicesData);
      if (sError) {
        throw new Error(`Error en tabla 'services': ${sError.message}. Asegúrate de ejecutar primero la estructura SQL en el editor de Supabase.`);
      }
      summary.services = servicesData.length;
    }

    // 2. Sync IG Accounts
    if (store.accounts && store.accounts.length > 0) {
      const accountsData = store.accounts.map(a => ({
        id: a.id,
        handle: a.handle,
        status: a.status,
        daily_limit: a.limit,
        sent_today: a.sentToday,
        reset_at: new Date().toISOString()
      }));

      const { error: aError } = await supabase.from("ig_accounts").upsert(accountsData);
      if (aError) {
        throw new Error(`Error en tabla 'ig_accounts': ${aError.message}`);
      }
      summary.ig_accounts = accountsData.length;
    }

    // 3. Sync Campaigns
    if (store.campaigns && store.campaigns.length > 0) {
      const campaignsData = store.campaigns.map(c => ({
        id: c.id,
        name: c.name,
        service_id: c.serviceId,
        status: c.status,
        messages_sent: c.messagesSent || 0,
        replies: c.replies || 0,
        qualified: c.qualified || 0,
        scheduled: c.scheduled || 0,
        initial_message: c.initialMessage || "",
        start_date: c.startDate ? new Date(c.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        last_active: c.lastActive || "Justo ahora"
      }));

      const { error: cError } = await supabase.from("campaigns").upsert(campaignsData);
      if (cError) {
        throw new Error(`Error en tabla 'campaigns': ${cError.message}`);
      }
      summary.campaigns = campaignsData.length;

      // 4. Sync Campaign Accounts pairings
      const campaignAccountsData: any[] = [];
      store.campaigns.forEach(c => {
        if (c.accounts && Array.isArray(c.accounts)) {
          c.accounts.forEach(accId => {
            campaignAccountsData.push({
              campaign_id: c.id,
              account_id: accId
            });
          });
        }
      });

      if (campaignAccountsData.length > 0) {
        const { error: caError } = await supabase.from("campaign_accounts").upsert(campaignAccountsData);
        if (caError) {
          throw new Error(`Error en tabla pivot 'campaign_accounts': ${caError.message}`);
        }
        summary.campaign_accounts = campaignAccountsData.length;
      }
    }

    // 5. Sync Contacts
    if (store.contacts && store.contacts.length > 0) {
      const contactsData = store.contacts.map(c => ({
        id: c.id,
        ig_handle: c.handle,
        name: c.name,
        status: c.status,
        conv_stage: c.conv_stage || "intro",
        conv_answers: c.conv_answers || {},
        conv_summary: c.conv_summary || "",
        objections: c.objections || [],
        appointment_at: c.appointmentDate ? new Date(c.appointmentDate).toISOString() : null,
        service_id: c.serviceId || null,
        campaign_id: c.campaignId || null,
        notes: c.notes || "",
        created_at: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        last_contact_at: c.lastContact && c.lastContact !== "Justo ahora" 
          ? new Date(c.lastContact).toISOString() 
          : new Date().toISOString()
      }));

      const { error: ctError } = await supabase.from("contacts").upsert(contactsData);
      if (ctError) {
        throw new Error(`Error en tabla 'contacts': ${ctError.message}`);
      }
      summary.contacts = contactsData.length;
    }

    res.json({
      success: true,
      message: "¡Sincronización exitosa con tu base de datos de Supabase en São Paulo!",
      summary
    });
  } catch (error: any) {
    console.error("[Supabase Sync Processor Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Fallo inesperado al migrar datos a Supabase."
    });
  }
});

// GET /api/supabase-config - Expose active orchestration state to UI
app.get("/api/supabase-config", async (req, res) => {
  const config = {
    url: SUPABASE_URL,
    hasApiKey: !!SUPABASE_ANON_KEY,
    status: SUPABASE_ANON_KEY ? "connected_real" : "sandbox_fallback",
    region: "sa-east-1 (São Paulo)",
    engine: "Supabase Core Edge Engine",
    syncEnabled: !!supabase
  };
  res.json(config);
});


// Configure Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Prospecting Server successfully boot-up. Listening on port ${PORT}`);
  });
}

setupServer();
