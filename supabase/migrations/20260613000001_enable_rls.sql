-- 1. Habilitar Row Level Security (RLS) en las tablas públicas
ALTER TABLE public.campaign_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_config ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas para acceso de usuarios autenticados
CREATE POLICY "Enable read/write for authenticated users" ON public.campaign_accounts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON public.daily_stats
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON public.wa_templates
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON public.ab_variants
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON public.followup_queue
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON public.conversion_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON public.ab_tests
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for authenticated users" ON public.followup_config
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Política especial para webhook_events: Permite inserciones anónimas (para Listener)
CREATE POLICY "Allow anonymous inserts" ON public.webhook_events
    FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users" ON public.webhook_events
    FOR SELECT TO authenticated USING (true);
