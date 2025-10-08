-- 016_users_view.sql
-- View for dashboard Users screen. If there are profiles, show those; otherwise fall back to users_mock.

create or replace view dashboard_users as
with have_profiles as (
  select exists(select 1 from profiles) as has_profiles
),
real as (
  select
    p.id,
    coalesce(p.display_name, concat_ws(' ', p.first_name, p.last_name)) as name,
    u.email,
    p.role::text as role,
    coalesce(unis.name, '—') as university,
    coalesce(agg.courses, 0)::int as courses,
    coalesce(agg.attempts, 0)::int as attempts,
    coalesce(agg.avg_score, 0)::numeric as avg_score,
    coalesce(pc.practice_coverage, 0)::numeric as practice_coverage,
    coalesce(p.is_active, true) as is_active,
    p.last_login as last_active_at
  from profiles p
  left join auth.users u on u.id = p.id
  left join universities unis on unis.id = p.university_id
  -- Aggregate courses/attempts/avg score from submissions
  left join lateral (
    select
      coalesce((
        select count(distinct q.course_id)
        from submissions s
        join quizzes q on q.id = s.quiz_id
        where s.user_id = p.id
      ), 0) as courses,
      coalesce((
        select count(*) from submissions s where s.user_id = p.id
      ), 0) as attempts,
      coalesce((
        select avg(s.score) from submissions s where s.user_id = p.id and s.score is not null
      ), 0) as avg_score
  ) agg on true
  -- Practice coverage: answered distinct practice questions / total distinct practice questions in attempted practice quizzes
  left join lateral (
    with user_practice_quizzes as (
      select distinct s.quiz_id
      from submissions s
      join quizzes q on q.id = s.quiz_id
      where s.user_id = p.id and coalesce(q.is_practice, false)
    ),
    total_practice_questions as (
      select count(distinct ques.id) as cnt
      from questions ques
      where ques.quiz_id in (select quiz_id from user_practice_quizzes)
    ),
    answered_practice_questions as (
      select count(distinct a.question_id) as cnt
      from answers a
      join submissions s on s.id = a.submission_id
      join quizzes q on q.id = s.quiz_id
      where s.user_id = p.id and coalesce(q.is_practice, false)
    )
    select case when tp.cnt > 0 then (ap.cnt::numeric / tp.cnt::numeric) else 0::numeric end as practice_coverage
    from total_practice_questions tp, answered_practice_questions ap
  ) pc on true
),
mock as (
  select m.id, m.name, m.email, m.role::text as role, m.university, m.courses, m.attempts,
         m.avg_score, m.practice_coverage, m.is_active, m.last_active_at
  from users_mock m
)
select * from real r where (select has_profiles from have_profiles)
union all
select * from mock m where not (select has_profiles from have_profiles);

-- Allow authenticated users with admin role to read the view
grant select on dashboard_users to authenticated;
