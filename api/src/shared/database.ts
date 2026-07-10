import { DefaultAzureCredential } from '@azure/identity'
import sql, { config as SqlConfig, ConnectionPool } from 'mssql'

let poolPromise: Promise<ConnectionPool> | null = null

async function createConfig(): Promise<SqlConfig | string> {
  const connectionString = process.env.SQL_CONNECTION_STRING

  if (connectionString) {
    return connectionString
  }

  const server = process.env.AZURE_SQL_SERVER
  const database = process.env.AZURE_SQL_DATABASE

  if (!server || !database) {
    throw new Error(
      'Database configuration is missing. Set SQL_CONNECTION_STRING locally or AZURE_SQL_SERVER and AZURE_SQL_DATABASE in Azure.',
    )
  }

  const credential = new DefaultAzureCredential()
  const token = await credential.getToken('https://database.windows.net/.default')

  if (!token) {
    throw new Error('Unable to obtain an Azure SQL access token.')
  }

  return {
    server,
    database,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
    authentication: {
      type: 'azure-active-directory-access-token',
      options: {
        token: token.token,
      },
    },
    pool: {
      min: 0,
      max: 10,
      idleTimeoutMillis: 30_000,
    },
  }
}

export async function getDatabasePool(): Promise<ConnectionPool> {
  if (!poolPromise) {
    poolPromise = createConfig()
      .then((config) => new sql.ConnectionPool(config).connect())
      .catch((error) => {
        poolPromise = null
        throw error
      })
  }

  return poolPromise
}
