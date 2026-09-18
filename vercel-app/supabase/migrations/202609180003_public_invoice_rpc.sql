-- Customer invoice view: expose only fields printed on the invoice.
create or replace function public.get_public_invoice(p_token uuid)
returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
  'quote_number',q.quote_number,
  'invoice_number',coalesce(nullif(q.invoice_number,''),'INV-'||regexp_replace(q.quote_number,'^Q-','')),
  'invoice_sent_at',coalesce(q.invoice_sent_at,q.accepted_at,q.created_at),
  'customer_name',q.customer_name,
  'company_name',q.company_name,
  'email',q.email,
  'project',q.project,
  'amount',q.amount,
  'service_type',q.service_type,
  'bank_details',coalesce(s.bank_details,'XYZ Bank'||chr(10)||'Account: 00-0000-0000000-00'),
  'company',coalesce(s.company_name,'RobeFlow Wardrobes'),
  'address',coalesce(s.address,'Christchurch, New Zealand'),
  'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'category',i.category,'system_type',i.system_type,'colour',i.colour,'quantity',i.quantity,'price',i.price) order by i.sort_order) from public.quote_items i where i.quote_id=q.id),'[]'::jsonb),
  'payments',coalesce((select jsonb_agg(jsonb_build_object('amount',p.amount,'payment_date',p.payment_date,'method',p.method) order by p.payment_date,p.id) from public.payment_transactions p where p.quote_id=q.id),'[]'::jsonb)
 )
 from public.quotes q left join public.company_settings s on s.id=1
 where q.acceptance_token=p_token and q.status='Accepted' and q.archived=false
 limit 1
$$;
revoke all on function public.get_public_invoice(uuid) from public;
grant execute on function public.get_public_invoice(uuid) to anon,authenticated;
notify pgrst,'reload schema';
