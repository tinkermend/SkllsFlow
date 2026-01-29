-- Active: 1769452445328@@127.0.0.1@5432@aiops@aiops
select * from users;

UPDATE aiops.users
SET
    locked_until = NULL,
    login_failed_count = 0
WHERE
    id = 1;