-- Apply manually AFTER 20261012_holiday_enquiries.sql. Preserves all existing rows/snapshots.
-- Permanent reservations deliberately have no FK or cascade: deletion cannot recycle a reference.
begin;
lock table public.holiday_enquiries in share row exclusive mode;
create table public.holiday_enquiry_reference_reservations (
  reference text primary key,
  reserved_at timestamptz not null default now()
);
alter table public.holiday_enquiry_reference_reservations enable row level security;
revoke all on public.holiday_enquiry_reference_reservations from public, anon, authenticated, service_role;
grant select, insert on public.holiday_enquiry_reference_reservations to service_role;
insert into public.holiday_enquiry_reference_reservations(reference)
  select reference from public.holiday_enquiries;

create function public.protect_holiday_reference_reservations()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Reference reservations are permanent';
end;
$$;
create trigger protect_holiday_reference_reservation_rows before update or delete
  on public.holiday_enquiry_reference_reservations for each row execute function public.protect_holiday_reference_reservations();
create trigger protect_holiday_reference_reservation_table before truncate
  on public.holiday_enquiry_reference_reservations for each statement execute function public.protect_holiday_reference_reservations();

create function public.reserve_holiday_enquiry_reference()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.holiday_enquiry_reference_reservations(reference) values (new.reference);
  return new;
end;
$$;
create trigger reserve_holiday_enquiry_reference before insert on public.holiday_enquiries
  for each row execute function public.reserve_holiday_enquiry_reference();

create function public.preserve_holiday_enquiry_reference()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.reference is distinct from old.reference then
    raise exception 'Issued enquiry references cannot change';
  end if;
  return new;
end;
$$;
create trigger preserve_holiday_enquiry_reference before update of reference on public.holiday_enquiries
  for each row execute function public.preserve_holiday_enquiry_reference();

-- Existing receive function, quotas, deduplication and retry functions stay intact.
-- A collision rolls back the entire receive subtransaction, including quota increments.
create function public.receive_holiday_enquiry_v2(
  p_id uuid, p_reference text, p_received_at timestamptz, p_brief jsonb, p_email jsonb,
  p_fingerprint text, p_session_hash text, p_email_hash text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare collision_constraint text;
begin
  if p_reference !~ '^PBJ-[1-9][0-9]{5}$' or p_reference is null then
    raise exception 'Invalid friendly enquiry reference';
  end if;
  begin
    return public.receive_holiday_enquiry(p_id,p_reference,p_received_at,p_brief,p_email,p_fingerprint,p_session_hash,p_email_hash);
  exception when unique_violation then
    get stacked diagnostics collision_constraint = constraint_name;
    if collision_constraint = 'holiday_enquiry_reference_reservations_pkey' then
      return jsonb_build_object('outcome','reference_collision');
    end if;
    raise;
  end;
end;
$$;
revoke all on function public.reserve_holiday_enquiry_reference() from public, anon, authenticated;
revoke all on function public.protect_holiday_reference_reservations() from public, anon, authenticated;
revoke all on function public.preserve_holiday_enquiry_reference() from public, anon, authenticated;
revoke all on function public.receive_holiday_enquiry_v2(uuid,text,timestamptz,jsonb,jsonb,text,text,text) from public, anon, authenticated;
grant execute on function public.reserve_holiday_enquiry_reference() to service_role;
grant execute on function public.preserve_holiday_enquiry_reference() to service_role;
grant execute on function public.receive_holiday_enquiry_v2(uuid,text,timestamptz,jsonb,jsonb,text,text,text) to service_role;
notify pgrst, 'reload schema';
commit;
