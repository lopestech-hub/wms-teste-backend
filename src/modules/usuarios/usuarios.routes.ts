import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'

export async function usuariosRoutes(app: FastifyInstance) {
  // lista usuarios (sem expor senha_hash)
  app.get('/usuarios', { onRequest: [app.authenticate] }, async (_req, reply) => {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { cod_usuario: 'asc' },
      select: {
        cod_usuario: true,
        nome: true,
        login: true,
        flg_ativo: true,
        dat_criacao: true,
      },
    })
    return reply.send(usuarios)
  })
}
