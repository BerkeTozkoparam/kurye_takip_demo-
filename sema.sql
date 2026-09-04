-- ============================================================
--  Kurye Paneli — veritabanı şeması (Postgres / Supabase)
--  Supabase > SQL Editor'e yapıştırıp bir kez çalıştırın.
-- ============================================================

-- ---------- 1. Tipler ----------

create type kullanici_rolu as enum ('yonetici', 'kurye', 'dukkan');

create type siparis_durumu as enum ('bekliyor', 'atandi', 'alindi', 'teslim', 'iptal');

create type odeme_tipi as enum ('nakit', 'kart', 'odendi');


-- ---------- 2. Kullanıcılar ----------
-- Supabase'in auth.users tablosu şifre/e-posta işini yapar.
-- Bizim tuttuğumuz kısım sadece kim kim ve ne rolde.

create table profiller (
  id          uuid primary key references auth.users on delete cascade,
  ad          text not null,
  telefon     text,
  rol         kullanici_rolu not null,
  aktif       boolean not null default true,
  olusturuldu timestamptz not null default now()
);


-- ---------- 3. Dükkanlar ----------

create table dukkanlar (
  id          uuid primary key default gen_random_uuid(),
  ad          text not null,
  adres       text not null,
  telefon     text,
  aktif       boolean not null default true,
  olusturuldu timestamptz not null default now()
);

-- Bir dükkanda birden fazla kişi çalışabilir (patron + kasiyer).
create table dukkan_uyeleri (
  dukkan_id   uuid not null references dukkanlar on delete cascade,
  kullanici_id uuid not null references profiller on delete cascade,
  primary key (dukkan_id, kullanici_id)
);


-- ---------- 4. Kuryeler ----------
-- Konum sütunları şimdi boş duruyor; canlı takibi eklerken
-- tabloyu değiştirmeye gerek kalmasın diye baştan açtım.

create table kuryeler (
  id               uuid primary key references profiller on delete cascade,
  arac             text,
  plaka            text,
  musait           boolean not null default true,
  son_lat          double precision,
  son_lng          double precision,
  son_konum_zamani timestamptz
);


-- ---------- 5. Siparişler ----------

create sequence siparis_no_seq start 1041;

create table siparisler (
  id              uuid primary key default gen_random_uuid(),
  kod             text not null unique default nextval('siparis_no_seq')::text,
  dukkan_id       uuid not null references dukkanlar on delete restrict,
  kurye_id        uuid references kuryeler on delete set null,
  olusturan_id    uuid not null references profiller,

  musteri_ad      text not null,
  musteri_telefon text,
  adres           text not null,
  kurye_notu      text,

  tutar           numeric(10,2) not null default 0,
  odeme           odeme_tipi not null default 'nakit',

  durum           siparis_durumu not null default 'bekliyor',
  olusturuldu     timestamptz not null default now(),
  atandi_at       timestamptz,
  alindi_at       timestamptz,
  teslim_at       timestamptz,
  iptal_at        timestamptz,
  iptal_sebep     text
);

create index on siparisler (durum) where durum = 'bekliyor';
create index on siparisler (dukkan_id, olusturuldu desc);
create index on siparisler (kurye_id, olusturuldu desc);

-- Her adımın kaydı. "Bu paket saat kaçta kimin eline geçti" sorusunun
-- cevabı burada; hakediş ve ortalama teslim süresi de bundan çıkar.
create table siparis_olaylari (
  id         bigserial primary key,
  siparis_id uuid not null references siparisler on delete cascade,
  durum      siparis_durumu not null,
  aktor_id   uuid references profiller,
  aciklama   text,
  ts         timestamptz not null default now()
);

create index on siparis_olaylari (siparis_id, ts);


-- ---------- 6. Davetler ----------
-- Yönetici bir dükkan açar ve e-posta davet eder. Kişi Supabase'ten
-- kayıt olunca aşağıdaki tetikleyici profilini ve dükkan bağını kurar.

create table davetler (
  eposta      text primary key,
  rol         kullanici_rolu not null,
  ad          text not null,
  dukkan_id   uuid references dukkanlar on delete cascade,
  kullanildi  boolean not null default false,
  olusturuldu timestamptz not null default now()
);

create or replace function yeni_kullanici_kur()
returns trigger language plpgsql security definer set search_path = public as $$
declare d davetler;
begin
  select * into d from davetler where eposta = new.email and not kullanildi;
  if not found then
    return new; -- daveti olmayan hesap profilsiz kalır, hiçbir şey göremez
  end if;

  insert into profiller (id, ad, rol) values (new.id, d.ad, d.rol);

  if d.rol = 'dukkan' and d.dukkan_id is not null then
    insert into dukkan_uyeleri (dukkan_id, kullanici_id) values (d.dukkan_id, new.id);
  elsif d.rol = 'kurye' then
    insert into kuryeler (id) values (new.id);
  end if;

  update davetler set kullanildi = true where eposta = d.eposta;
  return new;
end $$;

create trigger auth_kullanici_eklendi
  after insert on auth.users
  for each row execute function yeni_kullanici_kur();


-- ---------- 7. Yardımcı fonksiyonlar ----------
-- security definer: RLS içinde profilleri okurken sonsuz döngüye girmesin.

create or replace function benim_rolum()
returns kullanici_rolu language sql stable security definer set search_path = public as $$
  select rol from profiller where id = auth.uid();
$$;

create or replace function benim_dukkanlarim()
returns setof uuid language sql stable security definer set search_path = public as $$
  select dukkan_id from dukkan_uyeleri where kullanici_id = auth.uid();
$$;


-- ---------- 8. Durum geçiş kuralları ----------
-- Sıra atlanamaz, teslim edilen sipariş geri alınamaz.

create or replace function durum_gecisi_dogrula()
returns trigger language plpgsql as $$
begin
  if new.durum = old.durum then return new; end if;

  if not (
       (old.durum = 'bekliyor' and new.durum in ('atandi', 'iptal'))
    or (old.durum = 'atandi'   and new.durum in ('alindi', 'bekliyor', 'iptal'))
    or (old.durum = 'alindi'   and new.durum in ('teslim', 'iptal'))
  ) then
    raise exception 'Geçersiz durum değişikliği: % -> %', old.durum, new.durum;
  end if;

  new.atandi_at  := case when new.durum = 'atandi' then now() else new.atandi_at end;
  new.alindi_at  := case when new.durum = 'alindi' then now() else new.alindi_at end;
  new.teslim_at  := case when new.durum = 'teslim' then now() else new.teslim_at end;
  new.iptal_at   := case when new.durum = 'iptal'  then now() else new.iptal_at  end;

  insert into siparis_olaylari (siparis_id, durum, aktor_id)
  values (new.id, new.durum, auth.uid());

  return new;
end $$;

create trigger siparis_durum_kontrol
  before update of durum on siparisler
  for each row execute function durum_gecisi_dogrula();


-- ---------- 9. Siparişi üstlenme ----------
-- İki kurye aynı anda basarsa ikisine birden verilmemeli.
-- Tek UPDATE ile atomik: ilk basan alır, ikincisi boş döner.

create or replace function siparis_ustlen(p_siparis uuid)
returns siparisler language plpgsql security definer set search_path = public as $$
declare s siparisler;
begin
  if benim_rolum() <> 'kurye' then
    raise exception 'Yalnızca kuryeler sipariş üstlenebilir';
  end if;

  update siparisler
     set durum = 'atandi', kurye_id = auth.uid()
   where id = p_siparis and durum = 'bekliyor' and kurye_id is null
  returning * into s;

  if not found then
    raise exception 'Bu siparişi başka bir kurye aldı';
  end if;

  return s;
end $$;


-- ---------- 10. Satır güvenliği (RLS) ----------

alter table profiller       enable row level security;
alter table dukkanlar       enable row level security;
alter table dukkan_uyeleri  enable row level security;
alter table kuryeler        enable row level security;
alter table siparisler      enable row level security;
alter table siparis_olaylari enable row level security;
alter table davetler        enable row level security;

-- Profiller: herkes kendini görür, yönetici hepsini.
create policy profil_oku on profiller for select
  using (id = auth.uid() or benim_rolum() = 'yonetici');
create policy profil_yonet on profiller for all
  using (benim_rolum() = 'yonetici') with check (benim_rolum() = 'yonetici');

-- Dükkanlar: kendi dükkanını, kurye hepsini (alış adresi lazım), yönetici hepsini.
create policy dukkan_oku on dukkanlar for select
  using (
    benim_rolum() in ('yonetici', 'kurye')
    or id in (select benim_dukkanlarim())
  );
create policy dukkan_yonet on dukkanlar for all
  using (benim_rolum() = 'yonetici') with check (benim_rolum() = 'yonetici');

create policy uyelik_oku on dukkan_uyeleri for select
  using (kullanici_id = auth.uid() or benim_rolum() = 'yonetici');
create policy uyelik_yonet on dukkan_uyeleri for all
  using (benim_rolum() = 'yonetici') with check (benim_rolum() = 'yonetici');

-- Kuryeler: kurye ve yönetici görür; kurye yalnız kendi kaydını günceller.
create policy kurye_oku on kuryeler for select
  using (benim_rolum() in ('yonetici', 'kurye'));
create policy kurye_kendini_guncelle on kuryeler for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy kurye_yonet on kuryeler for all
  using (benim_rolum() = 'yonetici') with check (benim_rolum() = 'yonetici');

-- Siparişler: işin kalbi.
-- Dükkan yalnızca kendi siparişlerini görür ve açar.
create policy siparis_dukkan_oku on siparisler for select
  using (dukkan_id in (select benim_dukkanlarim()));
create policy siparis_dukkan_ekle on siparisler for insert
  with check (
    dukkan_id in (select benim_dukkanlarim())
    and olusturan_id = auth.uid()
    and durum = 'bekliyor'
  );
create policy siparis_dukkan_iptal on siparisler for update
  using (dukkan_id in (select benim_dukkanlarim()) and durum = 'bekliyor')
  with check (dukkan_id in (select benim_dukkanlarim()));

-- Kurye: bekleyen havuzu + kendi üzerindekiler.
create policy siparis_kurye_oku on siparisler for select
  using (benim_rolum() = 'kurye' and (durum = 'bekliyor' or kurye_id = auth.uid()));
create policy siparis_kurye_guncelle on siparisler for update
  using (kurye_id = auth.uid()) with check (kurye_id = auth.uid());

-- Yönetici: her şey.
create policy siparis_yonetici on siparisler for all
  using (benim_rolum() = 'yonetici') with check (benim_rolum() = 'yonetici');

-- Olay kaydı: ilgili siparişi görebilen olayları da görür. Kimse elle yazamaz.
create policy olay_oku on siparis_olaylari for select
  using (exists (select 1 from siparisler s where s.id = siparis_id));

create policy davet_yonet on davetler for all
  using (benim_rolum() = 'yonetici') with check (benim_rolum() = 'yonetici');


-- ---------- 11. Raporlama görünümü ----------
-- Hakediş ve gün sonu ekranı bunu okur, hesabı her seferinde
-- uygulama tarafında yapmaya gerek kalmaz.

create view gunluk_ozet as
select
  date_trunc('day', s.olusturuldu)                       as gun,
  s.dukkan_id,
  s.kurye_id,
  count(*)                                               as toplam,
  count(*) filter (where s.durum = 'teslim')             as teslim,
  count(*) filter (where s.durum = 'iptal')              as iptal,
  sum(s.tutar) filter (where s.durum = 'teslim')         as tahsilat,
  avg(extract(epoch from (s.teslim_at - s.olusturuldu))/60)
    filter (where s.durum = 'teslim')                    as ort_dakika
from siparisler s
group by 1, 2, 3;


-- ---------- 12. İlk yönetici ----------
-- Supabase > Authentication'dan kendinize bir hesap açın, sonra:
--
--   insert into profiller (id, ad, rol)
--   values ('BURAYA-AUTH-USER-ID', 'Berke', 'yonetici');
--
-- Bundan sonrasını uygulama içinden yönetebilirsiniz.


-- ---------- 13. Canlı güncelleme ----------
-- Kuryenin ekranına siparişin anında düşmesi için gerekli.

alter publication supabase_realtime add table siparisler;
