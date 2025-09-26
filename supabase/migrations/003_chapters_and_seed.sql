-- Add chapters table and seed course/chapter/quizzes for Organic Chemistry 1 & 2

create table if not exists chapters (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade,
  position int not null,
  title text not null,
  video_url text,
  created_at timestamptz default now()
);

-- Link quizzes optionally to chapters
alter table if exists quizzes add column if not exists chapter_id uuid references chapters(id) on delete set null;

-- Seed two courses with chapters if not present
with ins as (
  insert into courses (title, description) select 'Organic Chemistry 1', 'Foundations for Ochem 1' where not exists (select 1 from courses where title = 'Organic Chemistry 1') returning id
)
insert into courses (title, description)
select 'Organic Chemistry 2', 'Continuation for Ochem 2' where not exists (select 1 from courses where title = 'Organic Chemistry 2');

-- Fetch course ids
select id into temp table temp_courses from courses where title in ('Organic Chemistry 1', 'Organic Chemistry 2');

-- For each course, insert 10 chapters if none exist
do $$
declare
  cid uuid;
  course_row record;
  last_chapter uuid;
  qid uuid;
  q2id uuid;
begin
  for course_row in select id, title from courses where title in ('Organic Chemistry 1','Organic Chemistry 2') loop
    cid := course_row.id;
    if (select count(*) from chapters where course_id = cid) = 0 then
      for i in 1..10 loop
        -- Insert chapter and capture its UUID
        insert into chapters (course_id, position, title, video_url)
        values (cid, i, format('Chapter %s: Title placeholder', i), null)
        returning id into last_chapter;

        -- Create a practice quiz for the chapter and insert a question
        insert into quizzes (course_id, chapter_id, title, description, created_at)
        values (cid, last_chapter, format('Ch %s Practice Questions', i), 'Practice set', now())
        returning id into qid;

        insert into questions (quiz_id, position, text, type, points)
        values (qid, 1, 'Placeholder practice question', 'multiple_choice', 1);

        -- Create an official chapter quiz and insert a question
        insert into quizzes (course_id, chapter_id, title, description, created_at)
        values (cid, last_chapter, format('Chapter %s Quiz', i), 'Chapter quiz', now())
        returning id into q2id;

        insert into questions (quiz_id, position, text, type, points)
        values (q2id, 1, 'Placeholder quiz question', 'multiple_choice', 1);
      end loop;
    end if;
  end loop;
end$$;

-- Note: the seed creates placeholder questions and quizzes. Replace them later with real content and choices.
