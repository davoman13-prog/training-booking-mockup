import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getDatabasePool } from '../shared/database'

export async function health(_request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const pool = await getDatabasePool()
    await pool.request().query('SELECT 1 AS IsHealthy')

    return {
      status: 200,
      jsonBody: {
        status: 'healthy',
        database: 'connected',
        timestampUtc: new Date().toISOString(),
      },
    }
  } catch (error) {
    context.error('Health check failed.', error)

    return {
      status: 503,
      jsonBody: {
        status: 'unhealthy',
        database: 'unavailable',
        timestampUtc: new Date().toISOString(),
      },
    }
  }
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: health,
})
