-- Secure customer quote access without granting anonymous table access.
create or replace function public.get_public_quote(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'quote', to_jsonb(q) || jsonb_build_object(
      'quote_items',
      coalesce((
        select jsonb_agg(to_jsonb(i) order by i.sort_order)
        from public.quote_items i
        where i.quote_id = q.id
      ), '[]'::jsonb)
    )
  )
  into result
  from public.quotes q
  where q.acceptance_token = p_token
    and q.archived = false
  limit 1;

  return result;
end;
$$;

create or replace function public.respond_to_public_quote(
  p_token uuid,
  p_status text,
  p_purchase_order_number text default '',
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.quotes;
begin
  if p_status not in ('Accepted', 'Declined') then
    raise exception 'Choose accept or decline.';
  end if;

  update public.quotes
  set status = p_status,
      purchase_order_number = coalesce(trim(p_purchase_order_number), ''),
      customer_comment = coalesce(trim(p_comment), ''),
      accepted_at = case when p_status = 'Accepted' then now() else null end,
      job_stage = case when p_status = 'Accepted' then 'Site measure required' else job_stage end
  where acceptance_token = p_token
    and archived = false
  returning * into target;

  if target.id is null then
    return null;
  end if;

  insert into public.quote_activities(quote_id, action, detail, actor)
  values (
    target.id,
    'Quote ' || lower(p_status),
    coalesce(trim(p_comment), ''),
    'Customer'
  );

  return jsonb_build_object('status', target.status, 'quote_id', target.id);
end;
$$;

revoke all on function public.get_public_quote(uuid) from public;
revoke all on function public.respond_to_public_quote(uuid,text,text,text) from public;
grant execute on function public.get_public_quote(uuid) to anon, authenticated;
grant execute on function public.respond_to_public_quote(uuid,text,text,text) to anon, authenticated;
notify pgrst, 'reload schema';
