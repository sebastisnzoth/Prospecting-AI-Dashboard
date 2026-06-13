-- 1. Habilitar RLS en las tablas principales
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ig_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- 2. Definir políticas de acceso (ejemplo basado en user_id)
-- Aplicar esto para cada tabla que requiera restricción por usuario.
-- NOTA: Asegúrate de que todas estas tablas tengan una columna 'user_id'
-- que haga referencia a auth.users(id).

CREATE POLICY "Solo acceso propio" ON services
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Solo acceso propio" ON campaigns
FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Solo acceso propio" ON contacts
FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- Para tablas donde el acceso debe ser por campaña o cuenta, 
-- se debe ajustar la política usando JOINs o niveles de permiso superiores.
