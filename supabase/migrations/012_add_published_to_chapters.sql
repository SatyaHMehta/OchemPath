-- Add published status to chapters table

alter table chapters add column if not exists published boolean default false;

-- Add a comment to document the column
comment on column chapters.published is 'Whether the chapter is published and visible to students';