-- Script de Migración: Habilitar RLS y asegurar seguridad por usuario

-- Lista de tablas
DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'services', 'campaigns', 'contacts', 'webhook_events', 'ig_accounts', 
        'daily_stats', 'messages', 'campaign_accounts', 'message_templates', 
        'audit_logs', 'settings', 'integrations', 'folders', 'tags', 'profiles'
    ];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        -- 1. Agregar columna user_id si no existe
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)', tbl);
        
        -- 2. Habilitar RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- 3. Eliminar política anterior si existe
        EXECUTE format('DROP POLICY IF EXISTS "Solo acceso propio" ON %I', tbl);
        
        -- 4. Crear nueva política
        EXECUTE format('CREATE POLICY "Solo acceso propio" ON %I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', tbl);
    END LOOP;
END $$;
