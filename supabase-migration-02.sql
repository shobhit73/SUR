-- Sur — migration 02: email registration + profile-before-quiz
-- Run once in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
--
-- Why: a profile row is now created as soon as someone finishes the basic
-- details, before they take the 24 questions. Those rows carry a neutral
-- placeholder vector, so matching must skip them until the quiz is done.

alter table profiles add column if not exists quiz_completed boolean not null default false;

-- Existing rows were all created after a completed quiz, so mark them done.
update profiles set quiz_completed = true where quiz_completed = false;
