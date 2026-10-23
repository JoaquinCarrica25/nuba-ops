-- ============================================================
-- Nuba Ops — Esquema Supabase (proyecto nuevo y unificado)
-- ============================================================
-- Ejecutar una sola vez en el SQL Editor del proyecto nuevo.
-- Después se importan los datos de las dos apps antiguas.
-- ============================================================

-- ---------- APARTAMENTOS -------------------------------------
create table if not exists public.apartamentos (
  id          text primary key,              -- slug estable: 'almaden'
  nombre      text not null,                 -- nombre bonito: 'Almadén'
  legacy      text not null unique,          -- nombre en las apps viejas: 'ALMADEN'
  capacidad   integer not null default 2,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- RESERVAS -----------------------------------------
create table if not exists public.reservas (
  id             uuid primary key default gen_random_uuid(),
  apartamento_id text not null references public.apartamentos(id) on delete cascade,
  fecha_entrada  timestamptz not null,
  fecha_salida   timestamptz not null,
  huespedes      integer not null default 1,
  notas          text not null default '',
  created_at     timestamptz not null default now(),
  constraint reservas_fechas check (fecha_salida > fecha_entrada)
);

create index if not exists reservas_apto_idx on public.reservas (apartamento_id, fecha_entrada);
create index if not exists reservas_salida_idx on public.reservas (fecha_salida);

-- ---------- TAREAS (checklist 31 + tareas libres) ------------
create table if not exists public.tareas (
  id             text primary key,
  apartamento_id text not null references public.apartamentos(id) on delete cascade,
  item_id        integer,                    -- null = tarea libre
  nombre         text not null,
  grupo          text not null default 'otros',
  frecuencia     text not null default 'Semanalmente',
  estado         text not null default 'pendiente',  -- pendiente | completada
  funciona       boolean,
  fecha          date,
  hora           time,
  responsable    text not null default '',
  notas          text not null default '',
  patron_accion  text not null default '',
  foto_url       text,
  extra          boolean not null default false,
  updated_at     timestamptz not null default now(),
  unique (apartamento_id, item_id)
);

create index if not exists tareas_apto_idx on public.tareas (apartamento_id, grupo);

-- ---------- INCIDENCIAS --------------------------------------
create table if not exists public.incidencias (
  id                uuid primary key default gen_random_uuid(),
  apartamento_id    text not null references public.apartamentos(id) on delete cascade,
  descripcion       text not null,
  urgencia          text not null default 'media',   -- alta | media | baja
  estado            text not null default 'pendiente', -- pendiente | resuelta
  responsable       text not null default '',
  patron_accion     text not null default '',
  alerta_horas      integer not null default 48,
  fecha_apertura    timestamptz not null default now(),
  fecha_cierre      timestamptz,
  quien_reparo      text not null default '',
  coste             numeric(10,2) not null default 0,
  observaciones     text not null default '',
  foto_apertura_url text,
  foto_cierre_url   text,
  created_at        timestamptz not null default now()
);

create index if not exists incidencias_estado_idx on public.incidencias (estado, urgencia);
create index if not exists incidencias_apto_idx on public.incidencias (apartamento_id);

-- ---------- SEMILLA DE APARTAMENTOS --------------------------
insert into public.apartamentos (id, nombre, legacy, capacidad) values
  ('almaden',         'Almadén',              'ALMADEN',              2),
  ('carretas',        'Carretas',             'CARRETAS',             2),
  ('cava-alta',       'Cava Alta',            'CAVA ALTA',            2),
  ('concepcion',      'Concepción',           'CONCEPCIÓN',           2),
  ('costanilla',      'Costanilla',           'COSTANILLA',           2),
  ('fomento',         'Fomento',              'FOMENTO',              2),
  ('imperial',        'Imperial',             'IMPERIAL',             2),
  ('mayor',           'Mayor',                'MAYOR',                2),
  ('montera',         'Montera',              'MONTERA',              2),
  ('moratin',         'Moratín',              'MORATIN',              2),
  ('moreria',         'Morería',              'MORERIA',              2),
  ('moreno-nieto',    'Moreno Nieto',         'MORENO NIETO',         2),
  ('navas',           'Navas',                'NAVAS',                2),
  ('san-bartolome',   'San Bartolomé',        'SAN BARTOLOME',        2),
  ('san-miguel',      'San Miguel',           'SAN MIGUEL',           2),
  ('tetuan',          'Tetuán',               'TETUAN',               2),
  ('torrecilla',      'Torrecilla',           'TORRECILLA',           2),
  ('virgen-paloma',   'Virgen de la Paloma',  'VIRGEN DE LA PALOMA',  2),
  ('valencia',        'Valencia',             'VALENCIA',             2),
  ('olivar',          'Olivar',               'OLIVAR',               2),
  ('infante',         'Infante',              'INFANTE',              2),
  ('zurbano',         'Zurbano',              'ZURBANO',              4),
  ('robledo',         'Robledo',              'ROBLEDO',              6),
  ('mostenses',       'Mostenses',            'MOSTENSES',            2),
  ('antonio-lopes',   'Antonio Lopes',        'ANTONIO LOPES',        2)
on conflict (id) do update
  set nombre = excluded.nombre, legacy = excluded.legacy, capacidad = excluded.capacidad;

-- ============================================================
-- RLS
-- ============================================================
-- FASE 1 (ahora, sin login): acceso abierto, igual que hoy,
-- pero al menos escrito de forma explícita.
-- ⚠️ Cualquiera con la URL y la anon key puede leer y escribir.
-- ============================================================

alter table public.apartamentos enable row level security;
alter table public.reservas     enable row level security;
alter table public.tareas       enable row level security;
alter table public.incidencias  enable row level security;

drop policy if exists "equipo" on public.apartamentos;
drop policy if exists "equipo" on public.reservas;
drop policy if exists "equipo" on public.tareas;
drop policy if exists "equipo" on public.incidencias;

create policy "equipo" on public.apartamentos for all using (true) with check (true);
create policy "equipo" on public.reservas     for all using (true) with check (true);
create policy "equipo" on public.tareas       for all using (true) with check (true);
create policy "equipo" on public.incidencias  for all using (true) with check (true);

-- ============================================================
-- FASE 2 (cuando activemos Supabase Auth): cerrar todo a
-- usuarios con sesión. Descomentar y borrar las políticas
-- "equipo" de arriba.
-- ============================================================
-- create policy "sesion" on public.apartamentos for all
--   to authenticated using (true) with check (true);
-- ... repetir en las otras tres tablas.

-- ============================================================
-- STORAGE — bucket de evidencias
-- ============================================================
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do nothing;

drop policy if exists "evidencias lectura"  on storage.objects;
drop policy if exists "evidencias subida"   on storage.objects;
drop policy if exists "evidencias cambio"   on storage.objects;
drop policy if exists "evidencias borrado"  on storage.objects;

create policy "evidencias lectura" on storage.objects
  for select using (bucket_id = 'evidencias');

-- El WITH CHECK es lo que faltaba en las apps antiguas:
-- sin él, el INSERT de la foto falla en silencio.
create policy "evidencias subida" on storage.objects
  for insert with check (bucket_id = 'evidencias');

create policy "evidencias cambio" on storage.objects
  for update using (bucket_id = 'evidencias') with check (bucket_id = 'evidencias');

create policy "evidencias borrado" on storage.objects
  for delete using (bucket_id = 'evidencias');
