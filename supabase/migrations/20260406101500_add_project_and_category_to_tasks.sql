alter table tasks
add column if not exists project text;

alter table tasks
add column if not exists category text not null default 'work';

alter table tasks
drop constraint if exists tasks_category_check;

alter table tasks
add constraint tasks_category_check
check (category in ('work', 'break', 'outside'));
