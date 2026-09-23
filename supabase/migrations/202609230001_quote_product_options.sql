alter table public.quote_items
  add column if not exists frame_track_colour text not null default 'Undecided';
