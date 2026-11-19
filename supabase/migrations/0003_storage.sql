-- Bucket privado de evidências: 20 MB, somente PNG/JPG/WEBP ----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidences', 'evidences', false, 20971520, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = 20971520,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- Cada jogador só escreve em  <seu-uuid>/arquivo
create policy evidences_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidences' and (storage.foldername(name))[1] = auth.uid()::text);

create policy evidences_select on storage.objects for select to authenticated
  using (bucket_id = 'evidences' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy evidences_delete on storage.objects for delete to authenticated
  using (bucket_id = 'evidences' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
