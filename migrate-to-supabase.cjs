/**
 * migrate-to-supabase.cjs
 * Migrazione database.json → Supabase
 */

global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');


// 🔑 Supabase client (con la tua anon key)
const supabase = createClient(
  'https://vtzbyxcephundgllvrnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0emJ5eGNlcGh1bmRnbGx2cm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzkyOTAsImV4cCI6MjA4NzM1NTI5MH0.nUtniRGqV6JldYzweXZUxTkThYTHGLvqlh_kg0JRQxo'
);

async function main() {
    console.log('🚀 Starting migration from database.json to Supabase...\n');

    // Carica database.json
    const dbPath = path.join(__dirname, 'database.json');
    if (!fs.existsSync(dbPath)) {
        console.error('❌ database.json not found!');
        process.exit(1);
    }

    const rawData = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log('📂 Loaded database.json');
    console.log(`   - Orders: ${data.orders?.length || 0}`);
    console.log(`   - Workers: ${data.workers?.length || 0}`);
    console.log(`   - Availabilities: ${data.availabilities?.length || 0}`);
    console.log(`   - Recurring Absences: ${data.recurringAbsences?.length || 0}`);
    console.log(`   - Global Days: ${data.globalDays?.length || 0}`);
    console.log(`   - Work Logs: ${data.workLogs?.length || 0}\n`);

    let successCount = 0;
    let errorCount = 0;

    // ============================
    // MIGRAZIONE SETTINGS
    // ============================
    if (data.companySettings) {
        console.log('💾 Migrating company settings...');
        const { error } = await supabase
            .from('settings')
            .insert({ id: 1, data: data.companySettings })
            .select();

        if (error) {
            console.error('   ❌ Failed:', error.message);
            errorCount++;
        } else {
            console.log('   ✅ Company settings migrated');
            successCount++;
        }
    }

    // ============================
// MIGRAZIONE WORKERS
// ============================
if (data.workers && data.workers.length > 0) {
    console.log(`\n👷 Migrating ${data.workers.length} workers...`);
    for (const workerName of data.workers) {
        try {
            const password = data.workerPasswords?.[workerName] || null;

            const { error } = await supabase
                .from('workers')
                .insert({
                    id: crypto.randomUUID(),   // 🔥 ID obbligatorio
                    name: workerName,
                    password: password,
                    contact_data: null,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            console.log(`   ✅ ${workerName}`);
            successCount++;
        } catch (err) {
            console.error(`   ❌ ${workerName}: ${err.message}`);
            errorCount++;
        }
    }
}

 // ============================
// MIGRAZIONE ORDERS
// ============================
if (data.orders && data.orders.length > 0) {
    console.log(`\n📦 Migrating ${data.orders.length} orders...`);
    let count = 0;

    for (const order of data.orders) {
        try {
            const { error } = await supabase
                .from('work_orders')
                .insert({
                    id: crypto.randomUUID(),                // 🔥 obbligatorio
                    order_number: order.orderNumber || null,
                    opdrachtgever: order.opdrachtgever || null,
                    project_ref: order.projectRef || null,
                    address: order.address || null,
                    scheduled_date: order.scheduledDate || null,
                    scheduled_end_date: order.scheduledEndDate || null,
                    material: order.material || null,
                    status: order.status || "open",         // 🔥 obbligatorio
                    created_at: Date.now(),                 // BIGINT
                    assigned_worker: order.assignedWorker || null,
                    assignment_type: order.assignmentType || null,
                    data: order,              // JSONB - ✅ L'intero oggetto order
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            count++;
            successCount++;

            if (count % 10 === 0) {
                console.log(`   ⏳ ${count}/${data.orders.length} orders migrated...`);
            }

        } catch (err) {
            console.error(`   ❌ Order ${order.orderNumber}: ${err.message}`);
            errorCount++;
        }
    }

    console.log(`   ✅ All ${count} orders migrated`);
}

    // ============================
    // MIGRAZIONE AVAILABILITIES
    // ============================
    if (data.availabilities && data.availabilities.length > 0) {
        console.log(`\n📅 Migrating ${data.availabilities.length} availabilities...`);
        for (const availability of data.availabilities) {
            try {
                const { error } = await supabase
                    .from('availabilities')
                    .insert(availability);

                if (error) throw error;

                successCount++;
            } catch (err) {
                console.error(`   ❌ Availability: ${err.message}`);
                errorCount++;
            }
        }
        console.log('   ✅ All availabilities migrated');
    }

    // ============================
    // SUMMARY
    // ============================
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📈 Total: ${successCount + errorCount}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
        console.log('\n🎉 Migration completed successfully!');
    } else {
        console.log('\n⚠️ Migration completed with errors. Check logs above.');
    }
}

main().catch(err => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
});
