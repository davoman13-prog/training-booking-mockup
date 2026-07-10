import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { findOrCreateUser } from '../repositories/userRepository'
import { getAuthenticatedPrincipal } from '../shared/auth'

export async function me(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const principal = getAuthenticatedPrincipal(request)

  if (!principal) {
    return {
      status: 401,
      jsonBody: {
        code: 'NOT_AUTHENTICATED',
        message: 'You must sign in before using the training portal.',
      },
    }
  }

  try {
    const user = await findOrCreateUser(principal)

    if (!user.isActive || user.isAnonymised) {
      return {
        status: 403,
        jsonBody: {
          code: 'ACCOUNT_UNAVAILABLE',
          message: 'This account is not currently available.',
        },
      }
    }

    return {
      status: 200,
      jsonBody: user,
    }
  } catch (error) {
    context.error('Unable to load the current application user.', error)

    return {
      status: 500,
      jsonBody: {
        code: 'USER_LOOKUP_FAILED',
        message: 'The portal could not load your account. Please try again.',
      },
    }
  }
}

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'me',
  handler: me,
})
