import { Adapter } from 'next-auth/adapters'
import { prisma } from '../prisma'
import { NextApiRequest, NextApiResponse, NextPageContext } from 'next'
import { destroyCookie, parseCookies } from 'nookies'

export default function PrismaAdapter(
  req: NextApiRequest | NextPageContext['req'],
  res: NextApiResponse | NextPageContext['res'],
): Adapter {
  return {
    async createUser(user) {
      const { '@igniteCall:userId': userId } = parseCookies({ req })

      if (!userId) {
        throw new Error('User ID not found')
      }

      const prismaUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      })

      destroyCookie({ res }, '@igniteCall:userId')

      return {
        id: prismaUser.id,
        name: prismaUser.name,
        email: prismaUser.email!,
        username: prismaUser.username,
        avatar: prismaUser.avatar!,
        emailVerified: null,
      }
    },

    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      })

      if (!user) {
        return null
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email!,
        username: user.username,
        avatar: user.avatar!,
        emailVerified: null,
      }
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user) {
        return null
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email!,
        username: user.username,
        avatar: user.avatar!,
        emailVerified: null,
      }
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_provider_account_id: {
            provider,
            provider_account_id: providerAccountId,
          },
        },
        include: {
          user: true,
        },
      })

      if (!account) {
        return null
      }

      const { user } = account

      return {
        id: user.id,
        name: user.name,
        email: user.email!,
        username: user.username,
        avatar: user.avatar!,
        emailVerified: null,
      }
    },

    async updateUser(user) {
      const prismaUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      })

      return {
        id: prismaUser.id,
        name: prismaUser.name,
        email: prismaUser.email!,
        username: prismaUser.username,
        avatar: prismaUser.avatar!,
        emailVerified: null,
      }
    },

    async linkAccount(account) {
      await prisma.account.create({
        data: {
          user_id: account.userId,
          type: account.type,
          provider: account.provider,
          provider_account_id: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      })
    },

    async createSession({ sessionToken, userId, expires }) {
      await prisma.session.create({
        data: {
          session_token: sessionToken,
          user_id: userId,
          expires,
        },
      })

      return {
        sessionToken,
        userId,
        expires,
      }
    },

    async deleteSession(sessionToken) {
      await prisma.session.delete({
        where: {
          session_token: sessionToken,
        },
      })
    },

    async getSessionAndUser(sessionToken) {
      const prismaSession = await prisma.session.findUnique({
        where: {
          session_token: sessionToken,
        },
        include: {
          user: true,
        },
      })

      if (!prismaSession) {
        return null
      }

      const { user, ...session } = prismaSession

      return {
        session: {
          sessionToken: session.session_token,
          userId: session.user_id,
          expires: session.expires,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email!,
          username: user.username,
          avatar: user.avatar!,
          emailVerified: null,
        },
      }
    },

    async updateSession({ sessionToken, expires, userId }) {
      const prismaSession = await prisma.session.update({
        where: {
          session_token: sessionToken,
        },
        data: {
          expires,
          user_id: userId,
        },
      })

      return {
        sessionToken: prismaSession.session_token,
        userId: prismaSession.user_id,
        expires: prismaSession.expires,
      }
    },
  }
}
