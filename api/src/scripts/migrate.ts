import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { getDatabasePool } from '../shared/database'

async function run(): Promise<void> {
  const migrationsDirectory = path.resolve(process.cwd(), '..', 'database', 'migrations')
  const files = (await readdir(migrationsDirectory))
    .filter((file) => /^\d+_.*\.sql$/i.test(file))
    .sort((left, right) => left.localeCompare(right))

  if (files.length === 0) {
    console.log('No database migrations were found.')
    return
  }

  const pool = await getDatabasePool()

  for (const file of files) {
    const migrationId = Number.parseInt(file.split('_', 1)[0], 10)

    const appliedResult = await pool
      .request()
      .input('MigrationId', migrationId)
      .query<{ Applied: number }>(`
        IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
          SELECT 0 AS Applied;
        ELSE
          SELECT CASE WHEN EXISTS (
            SELECT 1 FROM dbo.SchemaMigrations WHERE MigrationId = @MigrationId
          ) THEN 1 ELSE 0 END AS Applied;
      `)

    if (appliedResult.recordset[0]?.Applied === 1) {
      console.log(`Skipping ${file}; already applied.`)
      continue
    }

    console.log(`Applying ${file}...`)
    const sqlText = await readFile(path.join(migrationsDirectory, file), 'utf8')
    const batches = sqlText
      .split(/^\s*GO\s*;?\s*$/gim)
      .map((batch) => batch.trim())
      .filter(Boolean)

    for (const batch of batches) {
      await pool.request().batch(batch)
    }

    console.log(`Applied ${file}.`)
  }

  await pool.close()
}

run().catch((error: unknown) => {
  console.error('Database migration failed.', error)
  process.exitCode = 1
})
