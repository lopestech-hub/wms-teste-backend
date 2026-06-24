import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'

export async function etiquetasRoutes(app: FastifyInstance) {
  // Quantidade ja inventariada de um produto em um endereco (para pre-preencher o campo)
  app.get('/etiquetas/quantidade', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { cod_produto, cod_endereco } = z
      .object({ cod_produto: z.string().min(1), cod_endereco: z.coerce.number().int() })
      .parse(req.query)

    const etiqueta = await prisma.produtoEtiqueta.findUnique({
      where: { cod_produto_cod_endereco: { cod_produto, cod_endereco } },
      select: { qtd_inventario: true },
    })

    // existe = ja ha contagem; qtd = valor atual (0 se nao existe)
    return reply.send({
      existe: etiqueta !== null,
      qtd_inventario: etiqueta ? Number(etiqueta.qtd_inventario) : 0,
    })
  })

  // Cadastrar/atualizar etiqueta: uma linha por produto+endereco (upsert).
  // A quantidade enviada e o TOTAL real do produto naquele endereco (substitui).
  app.post('/etiquetas', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({
      cod_produto: z.string().min(1),
      cod_barras: z.string().min(1),
      cod_endereco: z.number().int(),
      qtd_inventario: z.number().positive(),
      flg_divergencia: z.boolean().optional().default(false),
    })

    const { cod_produto, cod_barras, cod_endereco, qtd_inventario, flg_divergencia } =
      schema.parse(req.body)
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

    // upsert: se ja existe contagem do produto neste endereco, atualiza; senao cria
    const etiqueta = await prisma.produtoEtiqueta.upsert({
      where: { cod_produto_cod_endereco: { cod_produto, cod_endereco } },
      update: { cod_barras, qtd_inventario, flg_divergencia, id_usuario, dat_cadastro: new Date() },
      create: { cod_produto, cod_barras, cod_endereco, qtd_inventario, flg_divergencia, id_usuario },
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

  // Listar todas as etiquetas (tela de conferencia)
  app.get('/etiquetas', { onRequest: [app.authenticate] }, async (_req, reply) => {
    const etiquetas = await prisma.produtoEtiqueta.findMany({
      orderBy: { cod_etiqueta: 'asc' },
      select: {
        cod_etiqueta: true,
        cod_produto: true,
        cod_barras: true,
        cod_endereco: true,
        qtd_inventario: true,
        flg_divergencia: true,
        etiqueta_wms_erp: true,
        inventario: true,
        produto: { select: { descricao: true, referencia_fabricante: true } },
        endereco: { select: { endereco_completo: true } },
      },
    })
    return reply.send(etiquetas)
  })

  // Atualizar marcacoes de conferencia de uma etiqueta
  app.patch('/etiquetas/:cod_etiqueta/marcacao', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { cod_etiqueta } = z.object({ cod_etiqueta: z.coerce.number().int() }).parse(req.params)
    const body = z
      .object({
        etiqueta_wms_erp: z.boolean().optional(),
        inventario: z.boolean().optional(),
      })
      .parse(req.body)

    const r = await prisma.produtoEtiqueta.updateMany({
      where: { cod_etiqueta },
      data: body,
    })

    if (r.count === 0) {
      return reply.status(404).send({ error: 'Etiqueta não encontrada' })
    }

    return reply.send({ cod_etiqueta, ...body })
  })
}
