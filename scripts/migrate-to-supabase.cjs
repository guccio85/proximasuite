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
  'https://rutbuafxlptyajbmxgyr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1dGJ1YWZ4bHB0eWFqYm14Z3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzcwMzIsImV4cCI6MjA4NzQ1MzAzMn0.C3J8Kn_tQKHPs80Y3Qid_wi6RTdaAZXAR2ySwl7iG0Q'
);

async function main() {
    console.log('🚀 Starting migration from database.json to Supabase...\n');

    // Carica database.json (file rimasto nella root, scripts/ è una cartella sotto)
    const dbPath = path.join(__dirname, '../database.json');
    if (!fs.existsSync(dbPath)) {
        console.error('❌ database.json not found!');
        process.exit(1);
    }

    const rawData = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log('📂 Loaded database.json');
    console.log(`   - Orders: ${data.orders?.length || 0}`);
    console.log(`   - Workers: ${data.workers?.length || 0}`);
    console.log(`   - Settings: ${data.settings ? 'Yes' : 'No'}`);
    console.log(`   - Task Colors: ${data.settings?.taskColors ? Object.keys(data.settings.taskColors).length : 0}`);
    console.log(`   - Departments: ${data.settings?.departments?.length || 0}`);
    console.log(`   - Subcontractors: ${data.settings?.subcontractors?.length || 0}`);
    console.log(`   - Availabilities: ${data.availabilities?.length || 0}`);
    console.log(`   - Recurring Absences: ${data.recurringAbsences?.length || 0}`);
    console.log(`   - Global Days: ${data.globalDays?.length || 0}`);
    console.log(`   - Work Logs: ${data.workLogs?.length || 0}\n`);

    let successCount = 0;
    let errorCount = 0;

    // ============================
    // MIGRAZIONE COMPANY SETTINGS
    // ============================
    if (data.settings) {
        console.log('💾 Migrating company settings...');
        const { error } = await supabase
            .from('company_settings')
            .insert({ 
                id: 'default',
                company_name: data.settings.name || 'SNEP',
                admin_password: data.settings.adminPassword || '1111',
                mobile_permissions: data.settings.mobilePermissions || {
                    showClientName: true,
                    allowPhotoUpload: true,
                    allowDrawingsView: true
                }
            });

        if (error) {
            console.error('   ❌ Failed:', error.message);
            errorCount++;
        } else {
            console.log('   ✅ Company settings migrated');
            successCount++;
        }
    }

    // ============================
    // MIGRAZIONE TASK COLORS
    // ============================
    if (data.settings?.taskColors) {
        console.log(`\n🎨 Migrating ${Object.keys(data.settings.taskColors).length} task colors...`);
        for (const [key, color] of Object.entries(data.settings.taskColors)) {
            try {
                const { error } = await supabase
                    .from('task_colors')
                    .insert({
                        id: crypto.randomUUID(),
                        task_key: key,
                        color: color
                    });

                if (error) throw error;

                console.log(`   ✅ ${key}: ${color}`);
                successCount++;
            } catch (err) {
                console.error(`   ❌ ${key}: ${err.message}`);
                errorCount++;
            }
        }
    }

    // ============================
    // MIGRAZIONE DEPARTMENTS
    // ============================
    if (data.settings?.departments && data.settings.departments.length > 0) {
        console.log(`\n🏢 Migrating ${data.settings.departments.length} departments...`);
        for (let i = 0; i < data.settings.departments.length; i++) {
            const dept = data.settings.departments[i];
            try {
                // Insert department
                const { error: deptError } = await supabase
                    .from('departments')
                    .insert({
                        id: dept.id,
                        name: dept.name,
                        sort_order: i
                    });

                if (deptError) throw deptError;

                console.log(`   ✅ ${dept.name}`);
                successCount++;

                // Insert activities for this department
                if (dept.activities && dept.activities.length > 0) {
                    for (let j = 0; j < dept.activities.length; j++) {
                        const activity = dept.activities[j];
                        const { error: actError } = await supabase
                            .from('department_activities')
                            .insert({
                                department_id: dept.id,
                                activity: activity,
                                sort_order: j
                            });

                        if (actError) {
                            console.error(`      ❌ Activity ${activity}: ${actError.message}`);
                            errorCount++;
                        }
                    }
                    console.log(`      → ${dept.activities.length} activities added`);
                }

            } catch (err) {
                console.error(`   ❌ ${dept.name}: ${err.message}`);
                errorCount++;
            }
        }
    }

    // ============================
    // MIGRAZIONE SUBCONTRACTORS
    // ============================
    if (data.settings?.subcontractors && data.settings.subcontractors.length > 0) {
        console.log(`\n👔 Migrating ${data.settings.subcontractors.length} subcontractors...`);
        for (const sub of data.settings.subcontractors) {
            try {
                const { error } = await supabase
                    .from('subcontractors')
                    .insert({
                        id: sub.id,
                        name: sub.name,
                        email: sub.email || null,
                        phone: sub.phone || null,
                        address: sub.address || null,
                        contact_person: sub.contactPerson || null
                    });

                if (error) throw error;

                console.log(`   ✅ ${sub.name}`);
                successCount++;
            } catch (err) {
                console.error(`   ❌ ${sub.name}: ${err.message}`);
                errorCount++;
            }
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
            // ✅ USA L'ID ORIGINALE DELL'ORDINE invece di generarne uno nuovo
            const orderId = order.id || crypto.randomUUID();
            
            const { error } = await supabase
                .from('work_orders')
                .insert({
                    id: orderId,                            // ✅ ID originale preservato
                    order_number: order.orderNumber || null,
                    opdrachtgever: order.opdrachtgever || null,
                    project_ref: order.projectRef || null,
                    address: order.address || null,
                    scheduled_date: order.scheduledDate || null,
                    scheduled_end_date: order.scheduledEndDate || null,
                    material: order.material || null,
                    status: order.status || "In afwachting", // ✅ Default corretto
                    created_at: order.createdAt || Date.now(), // ✅ Preserva timestamp originale
                    assigned_worker: order.assignedWorker || null,
                    assignment_type: order.assignmentType || null,
                    data: order,                            // JSONB - Intero oggetto
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
                    .insert({
                        id: availability.id || crypto.randomUUID(),
                        worker: availability.worker,
                        date: availability.date,
                        type: availability.type
                    });

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
    // MIGRAZIONE RECURRING ABSENCES
    // ============================
    if (data.recurringAbsences && data.recurringAbsences.length > 0) {
        console.log(`\n🔁 Migrating ${data.recurringAbsences.length} recurring absences...`);
        for (const absence of data.recurringAbsences) {
            try {
                const { error } = await supabase
                    .from('recurring_absences')
                    .insert({
                        id: absence.id || crypto.randomUUID(),
                        worker: absence.worker,
                        type: absence.type,
                        time_of_day: absence.timeOfDay,
                        day_of_week: absence.dayOfWeek,
                        start_date: absence.startDate,
                        number_of_weeks: absence.numberOfWeeks,
                        note: absence.note || null
                    });

                if (error) throw error;

                successCount++;
            } catch (err) {
                console.error(`   ❌ Recurring absence: ${err.message}`);
                errorCount++;
            }
        }
        console.log('   ✅ All recurring absences migrated');
    }

    // ============================
    // MIGRAZIONE GLOBAL DAYS
    // ============================
    if (data.globalDays && data.globalDays.length > 0) {
        console.log(`\n🌍 Migrating ${data.globalDays.length} global days...`);
        for (const day of data.globalDays) {
            try {
                const { error } = await supabase
                    .from('global_days')
                    .insert({
                        date: day.date,
                        type: day.type
                    });

                if (error) throw error;

                successCount++;
            } catch (err) {
                console.error(`   ❌ Global day: ${err.message}`);
                errorCount++;
            }
        }
        console.log('   ✅ All global days migrated');
    }

    // ============================
    // MIGRAZIONE WORK LOGS
    // ============================
    if (data.workLogs && data.workLogs.length > 0) {
        console.log(`\n📝 Migrating ${data.workLogs.length} work logs...`);
        for (const log of data.workLogs) {
            try {
                const { error } = await supabase
                    .from('work_logs')
                    .insert({
                        id: log.id || crypto.randomUUID(),
                        order_id: log.orderId,
                        worker: log.worker,
                        date: log.date,
                        hours: log.hours,
                        note: log.note || null,
                        timestamp: log.timestamp || Date.now(),
                        category: log.category || null,
                        activity: log.activity || null
                    });

                if (error) throw error;

                successCount++;
            } catch (err) {
                console.error(`   ❌ Work log: ${err.message}`);
                errorCount++;
            }
        }
        console.log('   ✅ All work logs migrated');
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
