import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

export async function produtosRoutes(app: FastifyInstance) {
  app.get('/produtos/busca', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({ q: z.string().min(1) })
    const { q } = schema.parse(req.query)

    const produtos = await prisma.produto.findMany({
      where: {
        flg_ativo: 'S',
        OR: [
          { referencia_fabricante: { contains: q, mode: 'insensitive' } },
          { descricao: { contains: q, mode: 'insensitive' } },
          { cod_produto: { contains: q, mode: 'insensitive' } },
          { cod_barras: q },
        ],
      },
      take: 30,
      select: {
        cod_produto: true,
        referencia_fabricante: true,
        descricao: true,
        cod_barras: true,
        unidade_saida: true,
      },
    })

    return reply.send(produtos)
  })
}
