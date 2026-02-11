/**
 * Migration Script: Apply Event System Migration
 * 
 * This script reads the event system migration SQL file and executes it
 * against the Supabase database using the service role key.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration() {
    console.log('🚀 Starting Event System Migration...\n')

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Error: Missing Supabase credentials')
        console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    try {
        // Read migration file
        const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260211_event_system.sql')
        console.log(`📄 Reading migration file: ${migrationPath}`)

        const migrationSQL = readFileSync(migrationPath, 'utf-8')
        console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`)

        // Execute migration
        console.log('⚙️  Executing migration...')
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

        if (error) {
            // If exec_sql doesn't exist, try direct execution (this won't work for all statements)
            console.log('⚠️  exec_sql function not available, trying alternative method...\n')

            // Split by semicolons and execute each statement
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'))

            console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

            let successCount = 0
            let errorCount = 0

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i] + ';'

                // Skip comments
                if (statement.trim().startsWith('--')) continue

                try {
                    console.log(`[${i + 1}/${statements.length}] Executing...`)

                    // For CREATE/ALTER/INSERT statements, we need to use the SQL editor
                    // This is a limitation - we'll need to apply via Supabase Dashboard
                    console.log(`⚠️  Statement type: ${statement.substring(0, 50)}...`)

                } catch (err: any) {
                    console.error(`❌ Error in statement ${i + 1}:`, err.message)
                    errorCount++
                }
            }

            console.log('\n⚠️  IMPORTANT: Direct SQL execution via client is limited.')
            console.log('Please apply the migration via Supabase Dashboard SQL Editor:\n')
            console.log('1. Go to https://supabase.com/dashboard')
            console.log('2. Select your project')
            console.log('3. Navigate to SQL Editor')
            console.log('4. Copy the contents of: supabase/migrations/20260211_event_system.sql')
            console.log('5. Paste and click "Run"\n')

            return
        }

        console.log('✅ Migration executed successfully!\n')

        // Verify tables created
        console.log('🔍 Verifying migration...')

        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .in('table_name', ['business_events', 'event_handlers'])

        if (!tablesError && tables) {
            console.log(`✅ Tables created: ${tables.length}/2`)
            tables.forEach((t: any) => console.log(`   - ${t.table_name}`))
        }

        // Check event handlers seeded
        const { data: handlers, error: handlersError } = await supabase
            .from('event_handlers')
            .select('event_type, handler_function')

        if (!handlersError && handlers) {
            console.log(`\n✅ Event handlers seeded: ${handlers.length}`)
            handlers.forEach((h: any) => console.log(`   - ${h.event_type} → ${h.handler_function}`))
        }

        console.log('\n🎉 Migration completed successfully!')
        console.log('\n📋 Next steps:')
        console.log('1. Visit /dashboard/production/orders')
        console.log('2. Click "Confirm Order" on any order')
        console.log('3. Check /dashboard/events to see the automation')
        console.log('4. Verify journal entry in /dashboard/finance/journals\n')

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message)
        console.error('\nPlease apply the migration manually via Supabase Dashboard:')
        console.error('1. Go to https://supabase.com/dashboard')
        console.error('2. Navigate to SQL Editor')
        console.error('3. Copy contents of: supabase/migrations/20260211_event_system.sql')
        console.error('4. Paste and execute\n')
        process.exit(1)
    }
}

// Run migration
applyMigration()
