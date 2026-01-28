-- Active: 1769452445328@@127.0.0.1@5432@aiops@aiops
select * from sessions;

-- 删除查询返回的所有 enum 类型
DO $$
DECLARE
    enum_record RECORD;
BEGIN
    FOR enum_record IN
        SELECT
            n.nspname as schema_name,
            t.typname as enum_name
        FROM
            pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE
            n.nspname = 'public'
        GROUP BY n.nspname, t.typname
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', 
                      enum_record.schema_name, 
                      enum_record.enum_name);
    END LOOP;
END $$;

drop type if exists SessionStatus;


SELECT n.nspname as schema_name, t.typname as enum_name
FROM
    pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE
    n.nspname = 'public';