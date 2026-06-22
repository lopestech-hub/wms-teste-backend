import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { autenticar, criarUsuario } from './auth.service'

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (req, reply) => {
    const schema = z.object({
      login: z.string().min(1),
      senha: z.string().min(1),
    })

    const { login, senha } = schema.parse(req.body)

    const usuario = await autenticar(login, senha)
    const token = app.jwt.sign({ sub: usuario.id_usuario, nome: usuario.nome })

    return reply.send({ token, usuario })
  })

  // criar usuario - exige estar autenticado (admin logado)
  app.post('/auth/criar-usuario', { onRequest: [app.authenticate] }, async (req, reply) => {
    const schema = z.object({
      nome: z.string().min(1),
      login: z.string().min(1),
      senha: z.string().min(1),
    })

    const { nome, login, senha } = schema.parse(req.body)

    try {
      const usuario = await criarUsuario(nome, login, senha)
      return reply.status(201).send(usuario)
    } catch (err: any) {
      // P2002 = violacao de unique (login ja existe)
      if (err?.code === 'P2002') {
        return reply.status(409).send({ error: 'Este login já está em uso' })
      }
      throw err
    }
  })
}
