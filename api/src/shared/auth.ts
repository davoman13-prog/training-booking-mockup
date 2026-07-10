import { HttpRequest } from '@azure/functions'

export interface AuthenticatedPrincipal {
  identityProvider: string
  providerUserId: string
  email: string
  roles: string[]
}

interface StaticWebAppsPrincipal {
  identityProvider?: string
  userId?: string
  userDetails?: string
  userRoles?: string[]
}

export function getAuthenticatedPrincipal(request: HttpRequest): AuthenticatedPrincipal | null {
  const encodedPrincipal = request.headers.get('x-ms-client-principal')

  if (encodedPrincipal) {
    try {
      const decoded = Buffer.from(encodedPrincipal, 'base64').toString('utf8')
      const principal = JSON.parse(decoded) as StaticWebAppsPrincipal

      if (principal.userId && principal.userDetails) {
        return {
          identityProvider: principal.identityProvider ?? 'unknown',
          providerUserId: principal.userId,
          email: principal.userDetails.trim().toLowerCase(),
          roles: principal.userRoles ?? [],
        }
      }
    } catch {
      return null
    }
  }

  if (process.env.ALLOW_LOCAL_AUTH === 'true') {
    const providerUserId = request.headers.get('x-local-user-id')
    const email = request.headers.get('x-local-user-email')

    if (providerUserId && email) {
      return {
        identityProvider: 'local-development',
        providerUserId,
        email: email.trim().toLowerCase(),
        roles: ['authenticated'],
      }
    }
  }

  return null
}
