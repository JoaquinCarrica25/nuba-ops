-- ============================================================
-- Nuba Ops · Preparar el proyecto ACTUAL de incidencias
-- ============================================================
-- Este proyecto ya tiene los 25 apartamentos (con UUID), las
-- 276 reservas y las 41 averías. No se borra nada: solo se
-- añade lo que falta para la app nueva.
--
-- Pegar entero en Supabase → SQL Editor → Run.
-- ============================================================

-- ---------- 1. slug legible para las URLs --------------------
alter table public.apartamentos add column if not exists slug text;

update public.apartamentos a
set slug = v.slug
from (values
  ('ALMADEN',            'almaden'),
  ('CARRETAS',           'carretas'),
  ('CAVA ALTA',          'cava-alta'),
  ('CONCEPCIÓN',         'concepcion'),
  ('COSTANILLA',         'costanilla'),
  ('FOMENTO',            'fomento'),
  ('IMPERIAL',           'imperial'),
  ('MAYOR',              'mayor'),
  ('MONTERA',            'montera'),
  ('MORATIN',            'moratin'),
  ('MORERIA',            'moreria'),
  ('MORENO NIETO',       'moreno-nieto'),
  ('NAVAS',              'navas'),
  ('SAN BARTOLOME',      'san-bartolome'),
  ('SAN MIGUEL',         'san-miguel'),
  ('TETUAN',             'tetuan'),
  ('TORRECILLA',         'torrecilla'),
  ('VIRGEN DE LA PALOMA','virgen-paloma'),
  ('VALENCIA',           'valencia'),
  ('OLIVAR',             'olivar'),
  ('INFANTE',            'infante'),
  ('ZURBANO',            'zurbano'),
  ('ROBLEDO',            'robledo'),
  ('MOSTENSES',          'mostenses'),
  ('ANTONIO LOPES',      'antonio-lopes')
) as v(nombre, slug)
where a.nombre = v.nombre;

create unique index if not exists apartamentos_slug_idx on public.apartamentos (slug);

-- ---------- 2. Tabla de tareas (checklist + extras) ----------
create table if not exists public.tareas (
  id             text primary key,
  apartamento_id uuid not null references public.apartamentos(id) on delete cascade,
  item_id        integer,
  nombre         text not null,
  grupo          text not null default 'otros',
  frecuencia     text not null default 'Semanalmente',
  estado         text not null default 'pendiente',
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

-- ---------- 3. Historial importado de la app antigua ---------
create table if not exists public.historial_nuba (
  id                  uuid primary key default gen_random_uuid(),
  apartamento_id      uuid references public.apartamentos(id) on delete cascade,
  item_id             integer,
  nombre              text,
  estado              boolean,
  funciona            boolean,
  responsable         text default '',
  notas               text default '',
  foto_url            text,
  fecha_verificacion  date,
  created_at          timestamptz default now()
);

create index if not exists historial_apto_idx on public.historial_nuba (apartamento_id, fecha_verificacion desc);

-- ---------- 4. Seguridad de las tablas nuevas ----------------
alter table public.tareas          enable row level security;
alter table public.historial_nuba  enable row level security;

drop policy if exists "equipo" on public.tareas;
drop policy if exists "equipo" on public.historial_nuba;
create policy "equipo" on public.tareas         for all using (true) with check (true);
create policy "equipo" on public.historial_nuba for all using (true) with check (true);

-- ---------- 5. Bucket de fotos de la app nueva ---------------
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do nothing;

drop policy if exists "evidencias lectura" on storage.objects;
drop policy if exists "evidencias subida"  on storage.objects;
drop policy if exists "evidencias cambio"  on storage.objects;
drop policy if exists "evidencias borrado" on storage.objects;

create policy "evidencias lectura" on storage.objects
  for select using (bucket_id = 'evidencias');
create policy "evidencias subida" on storage.objects
  for insert with check (bucket_id = 'evidencias');
create policy "evidencias cambio" on storage.objects
  for update using (bucket_id = 'evidencias') with check (bucket_id = 'evidencias');
create policy "evidencias borrado" on storage.objects
  for delete using (bucket_id = 'evidencias');

-- ---------- 6. Comprobación --------------------------------
select 'apartamentos' as tabla, count(*) from public.apartamentos
union all select 'con slug', count(*) from public.apartamentos where slug is not null
union all select 'reservas', count(*) from public.reservas
union all select 'averias', count(*) from public.averias
union all select 'tareas', count(*) from public.tareas;
