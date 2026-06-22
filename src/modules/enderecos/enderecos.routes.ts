import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

export async function enderecosRoutes(app: FastifyInstance) {
  app.get('/enderecos/:cod_endereco', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { cod_endereco } = z.object({ cod_endereco: z.coerce.number() }).parse(req.params)

    const endereco = await prisma.endereco.findUnique({ where: { cod_endereco } })

    if (!endereco) {
      return reply.status(404).send({ error: 'Endereço não encontrado' })
    }

    return reply.send(endereco)
  })
}
