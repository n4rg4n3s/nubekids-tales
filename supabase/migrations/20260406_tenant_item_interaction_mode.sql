alter table public.tenants
    add column if not exists item_interaction_mode text
    check (item_interaction_mode in ('generic', 'wearable', 'interactive'));

update public.tenants
set item_interaction_mode = case
    when item_interaction_mode is not null then item_interaction_mode
    when lower(coalesce(vertical_id, '')) in ('shoe-store', 'fashion-store') then 'wearable'
    when lower(coalesce(vertical_id, '')) = 'direct-b2c' then 'generic'
    when lower(coalesce(item_label, '')) like '%prenda%' then 'wearable'
    when lower(coalesce(item_label, '')) like '%ropa%' then 'wearable'
    when lower(coalesce(item_label, '')) like '%zapato%' then 'wearable'
    when lower(coalesce(item_label, '')) like '%zapat%' then 'wearable'
    when lower(coalesce(item_label, '')) like '%juguet%' then 'interactive'
    when lower(coalesce(item_label, '')) like '%peluch%' then 'interactive'
    when lower(coalesce(item_label, '')) like '%robot%' then 'interactive'
    else 'generic'
end
where item_interaction_mode is null;
