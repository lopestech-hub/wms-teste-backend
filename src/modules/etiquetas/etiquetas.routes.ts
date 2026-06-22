import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

export async function etiquetasRoutes(app: FastifyInstance) {
  // Cadastrar etiqueta (barcode + endereco + quantidade)
  app.post('/etiquetas', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({
      cod_produto: z.string().min(1),
      cod_barras: z.string().min(1),
      cod_endereco: z.number().int(),
      qtd_inventario: z.number().positive(),
    })

    const { cod_produto, cod_barras, cod_endereco, qtd_inventario } = schema.parse(req.body)
    const id_usuario = (req.user as { sub: string }).sub

    // valida se produto existe
    const produto = await prisma.produto.findUnique({ where: { cod_produto } })
    if (!produto) {
      return reply.status(404).send({ error: 'Produto não encontrado' })
    }

    // valida se endereco existe
    const endereco = await prisma.endereco.findUnique({ where: { cod_endereco } })
    if (!endereco) {
      return reply.status(404).send({ error: 'Endereço não encontrado' })
    }

    const etiqueta = await prisma.produtoEtiqueta.create({
      data: { cod_produto, cod_barras, cod_endereco, qtd_inventario, id_usuario },
      include: {
        produto: { select: { descricao: true, referencia_fabricante: true } },
        endereco: { select: { endereco_completo: true } },
      },
    })

    return reply.status(201).send(etiqueta)
  })

  // Listar etiquetas de um produto
  app.get('/etiquetas/produto/:cod_produto', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { cod_produto } = z.object({ cod_produto: z.string() }).parse(req.params)

    const etiquetas = await prisma.produtoEtiqueta.findMany({
      where: { cod_produto },
      include: {
        endereco: { select: { endereco_completo: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { dat_cadastro: 'desc' },
    })

    return reply.send(etiquetas)
  })
}
