#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const argon2 = require('argon2');
const { Client } = require('pg');

const MAX_COUNT = 1_000_000;
const DEFAULT_BATCH_SIZE = 5_000;
const DEFAULT_PASSWORD = 'TestPassword123!';

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || Object.hasOwn(process.env, match[1])) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function readPositiveInteger(args, name, fallback, max) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const raw = args[index + 1];
  if (!raw || !/^\d+$/.test(raw)) throw new Error(`Provide a positive number after ${name}.`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw new Error(`${name} must be between 1 and ${max}.`);
  }
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: npm run seed:users -- [--count N] [--batch-size N] [--confirm]');
    console.log('Account password: TestPassword123! (override with SEED_USER_PASSWORD).');
    console.log('By default, the script only prints a plan. Add --confirm to insert users.');
    return;
  }

  const count = readPositiveInteger(args, '--count', MAX_COUNT, MAX_COUNT);
  const batchSize = readPositiveInteger(args, '--batch-size', DEFAULT_BATCH_SIZE, 50_000);
  const confirmed = args.includes('--confirm');
  const runId = `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`;

  console.log(`Plan: ${count.toLocaleString('en-US')} synthetic users in batches of ${batchSize.toLocaleString('en-US')}.`);
  console.log(`Emails: loadtest_${runId}_0000001@example.test … (test domain example.test).`);
  console.log('Users will receive a random provider (local/google), is_verified=true, and the USER role.');
  console.log(`Shared password: ${process.env.SEED_USER_PASSWORD || DEFAULT_PASSWORD}`);
  if (!confirmed) {
    console.log('Preview mode — the database was not changed. Add --confirm to insert users.');
    return;
  }

  loadEnvFile();
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to write: NODE_ENV is set to production.');
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'auth_user',
    password: process.env.DB_PASSWORD || 'auth_password',
    database: process.env.DB_NAME || 'auth_db',
    connectionTimeoutMillis: 10_000,
  });

  let inserted = 0;
  try {
    const password = process.env.SEED_USER_PASSWORD || DEFAULT_PASSWORD;
    const pepper = process.env.PEPPER || '';
    const passwordHash = await argon2.hash(password + pepper, {
      type: argon2.argon2id,
      timeCost: 4,
      memoryCost: 2 ** 16,
      parallelism: 2,
    });
    await client.connect();
    while (inserted < count) {
      const batchCount = Math.min(batchSize, count - inserted);
      const start = inserted + 1;
      const end = inserted + batchCount;
      const result = await client.query(
        `WITH new_users AS (
           INSERT INTO users (email, password, provider, is_verified)
           SELECT $1 || '_' || lpad(n::text, 7, '0') || '@example.test', $4,
                  (CASE WHEN random() < 0.5 THEN 'local' ELSE 'google' END)::users_provider_enum, TRUE
           FROM generate_series($2::int, $3::int) AS n
           RETURNING _id
         ), new_roles AS (
           INSERT INTO user_roles (role, user_id)
           SELECT 'USER', _id FROM new_users
           RETURNING user_id
         )
         SELECT count(*)::int AS inserted FROM new_roles`,
        [`loadtest_${runId}`, start, end, passwordHash],
      );
      inserted += result.rows[0].inserted;
      console.log(`Inserted ${inserted.toLocaleString('en-US')} / ${count.toLocaleString('en-US')}`);
    }
    console.log(`Done. Inserted ${inserted.toLocaleString('en-US')} users.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Failed to insert users: ${error.message}`);
  process.exitCode = 1;
});
