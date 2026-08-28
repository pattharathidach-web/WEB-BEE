const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

loadEnvFile(path.join(__dirname, '..', '.env'));

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Copy the Supabase connection string into .env first.');
  process.exit(1);
}

async function main() {
  const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  await client.query(schema);
  await client.end();

  console.log('Supabase tables are ready: health_records, app_users');
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
