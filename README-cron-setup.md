# Configuración del Cron de Follow-up

## 🚀 Setup en 3 pasos

### Paso 1 — Agregar el workflow a tu repositorio

Copia la carpeta `.github/` al raíz de tu repositorio de GitHub:

```
tu-repo/
├── .github/
│   └── workflows/
│       └── follow-up-cron.yml   ← este archivo
├── ig-dm-listener/
└── ...
```

Si aún no tienes un repositorio, crea uno en github.com y sube estos archivos.

---

### Paso 2 — Probar localmente primero (recomendado)

```bash
# Modo dry_run: muestra qué leads procesaría SIN enviar mensajes
bash test-follow-up.sh true

# Modo producción: envía los follow-ups reales
bash test-follow-up.sh false

# Solo una campaña específica (en dry_run)
bash test-follow-up.sh true "UUID-de-tu-campaña"
```

---

### Paso 3 — Activar el cron en GitHub

1. Sube los archivos al repo
2. Ve a tu repo → **Actions** → verás "Follow-up leads inactivos"
3. El cron corre automáticamente cada hora
4. Para ejecutar manualmente: Actions → Run workflow → elige dry_run o no

---

## ⏰ Horario del cron

El cron está configurado para correr **cada hora en punto (UTC)**:

```yaml
cron: "0 * * * *"
```

Para cambiar la frecuencia, edita el archivo `.github/workflows/follow-up-cron.yml`:

| Frecuencia | Cron expression |
|---|---|
| Cada hora | `0 * * * *` |
| Cada 2 horas | `0 */2 * * *` |
| A las 9am UTC | `0 9 * * *` |
| Cada 30 min | `*/30 * * * *` |

---

## 🔍 Ver resultados

Después de cada ejecución, GitHub Actions muestra un resumen:
- Cuántos leads procesados
- Status de la ejecución
- Logs completos con los mensajes generados

Ve a: **Actions → Follow-up leads inactivos → [última ejecución] → Resumen**

---

## ✅ Configuración actual en Supabase

- **Proyecto:** prospecting-ai-backend
- **Endpoint:** `https://ftyvtfnvechetczhcbfe.supabase.co/functions/v1/follow-up`
- **Follow-up habilitado:** Configurable por campaña (columna `follow_up_enabled`)
- **Máx. intentos:** 3 por lead (columna `follow_up_max_count`)
- **Delay:** 24 horas de inactividad (columna `follow_up_delay_hours`)

Para ajustar la configuración por campaña, actualiza en Supabase:
```sql
UPDATE campaigns 
SET follow_up_enabled = true,
    follow_up_delay_hours = 24,
    follow_up_max_count = 3
WHERE name = 'Tu Campaña';
```
