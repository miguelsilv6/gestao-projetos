import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const utilizador = await prisma.utilizador.findUnique({
          where: { email: credentials.email as string },
        })

        if (!utilizador || !utilizador.ativo) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          utilizador.passwordHash,
        )
        if (!valid) return null

        return {
          id: utilizador.id,
          nome: utilizador.nome,
          email: utilizador.email,
          role: utilizador.role,
          brigadaId: utilizador.brigadaId,
        }
      },
    }),
  ],
})
