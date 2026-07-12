// One-off seed script: creates a "Fleet Manager" role (if missing), gives it
// full 'edit' access on every module, and inserts one test user you can log
// in with. Run this locally (not in this sandbox) after filling in .env:
//
//   node scripts/seed-test-user.js
//
// Then log in with:
//   email:    admin@fleet.test
//   password: Password123!

require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('../src/config/supabase');

const TEST_EMAIL = 'admin@fleet.test';
const TEST_PASSWORD = 'Password123!';
const TEST_NAME = 'Test Admin';
const ROLE_NAME = 'Fleet Manager';
const MODULES = ['fleet', 'drivers', 'trips', 'fuel_expenses', 'analytics'];

async function main() {
  // 1. Ensure the role exists
  let { data: role, error: roleErr } = await supabase
    .from('roles')
    .select('id, name')
    .eq('name', ROLE_NAME)
    .maybeSingle();
  if (roleErr) throw roleErr;

  if (!role) {
    const { data: newRole, error: insertRoleErr } = await supabase
      .from('roles')
      .insert({ name: ROLE_NAME })
      .select()
      .single();
    if (insertRoleErr) throw insertRoleErr;
    role = newRole;
    console.log(`Created role '${ROLE_NAME}' (id=${role.id})`);
  } else {
    console.log(`Role '${ROLE_NAME}' already exists (id=${role.id})`);
  }

  // 2. Give it full edit access on every module
  for (const module of MODULES) {
    const { error: permErr } = await supabase
      .from('rbac_permissions')
      .upsert({ role_id: role.id, module, access_level: 'edit' }, { onConflict: 'role_id,module' });
    if (permErr) throw permErr;
  }
  console.log(`Granted 'edit' on all modules to '${ROLE_NAME}'`);

  // 3. Create the test user (skip if it already exists)
  const { data: existingUser, error: lookupErr } = await supabase
    .from('users')
    .select('id')
    .eq('email', TEST_EMAIL)
    .maybeSingle();
  if (lookupErr) throw lookupErr;

  if (existingUser) {
    console.log(`User ${TEST_EMAIL} already exists - skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const { error: userErr } = await supabase.from('users').insert({
    email: TEST_EMAIL,
    password_hash: passwordHash,
    name: TEST_NAME,
    role_id: role.id,
  });
  if (userErr) throw userErr;

  console.log(`\nSeeded test user:`);
  console.log(`  email:    ${TEST_EMAIL}`);
  console.log(`  password: ${TEST_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
  });
