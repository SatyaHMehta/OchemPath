-- Add description column to chapters table

alter table chapters add column if not exists description text;

-- Add a comment to document the column
comment on column chapters.description is 'Optional description for the chapter content';