import { Password } from '@convex-dev/auth/providers/Password'
import { convexAuth } from '@convex-dev/auth/server'

const ALLOWED_SIGNUP_DOMAIN = 'hayppgroup.com'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? '').trim().toLowerCase()
        const name = String(params.name ?? '').trim()
        const flow = String(params.flow ?? '')

        if (flow === 'signUp' && !email.endsWith(`@${ALLOWED_SIGNUP_DOMAIN}`)) {
          throw new Error('Only allowed email adresses can register.')
        }

        return {
          email,
          name: name || email.split('@')[0] || 'User',
        }
      },
    }),
  ],
})
