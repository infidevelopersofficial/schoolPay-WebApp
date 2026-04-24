-- Native PostgreSQL Row-Level Security Policies for Multi-Tenant Data Isolation

DO $$
DECLARE
    t_name text;
    tables_to_secure text[] := ARRAY[
        'Student', 'Teacher', 'Parent', 'Class', 'Batch', 'Enrollment', 
        'Subject', 'Fee', 'Invoice', 'Payment', 'Lesson', 'Exam', 'Result', 
        'Attendance', 'Event', 'Message', 'Announcement', 'AcademicSession'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_to_secure
    LOOP
        -- Enable RLS on the table
        EXECUTE format('ALTER TABLE "%s" ENABLE ROW LEVEL SECURITY;', t_name);
        
        -- Create a policy that allows access ONLY IF:
        -- 1. The app.current_tenant is explicitly set to empty string '' (System Bypass)
        -- 2. The app.current_tenant matches the row's schoolId
        -- If app.current_tenant is NULL (not set by Prisma), access is completely denied.
        EXECUTE format('
            CREATE POLICY "tenant_isolation_policy" ON "%s"
            FOR ALL
            USING (
                current_setting(''app.current_tenant'', TRUE) = '''' OR 
                "schoolId" = current_setting(''app.current_tenant'', TRUE)
            )
            WITH CHECK (
                current_setting(''app.current_tenant'', TRUE) = '''' OR 
                "schoolId" = current_setting(''app.current_tenant'', TRUE)
            );
        ', t_name);

        -- Force RLS even for table owners
        EXECUTE format('ALTER TABLE "%s" FORCE ROW LEVEL SECURITY;', t_name);
    END LOOP;
END $$;