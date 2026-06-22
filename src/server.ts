import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './modules/auth/auth.routes'
import { produtosRoutes } from './modules/produtos/produtos.routes'
import { enderecosRoutes } from './modules/enderecos/enderecos.routes'
import { etiquetasRoutes } from './modules/etiquetas/etiquetas.routes'

const app = Fastify({ logger: true })

// plugins
app.register(cors, { origin: '*' })
app.register(jwt, { secret: process.env.JWT_SECRET ?? 'wms_secret' })

// decorator de autenticacao
app.decorate('authenticate', async function (req: any, reply: any) {
  try {
    await req.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Não autorizado' })
  }
})

// rotas
app.register(authRoutes)
app.register(produtosRoutes)
app.register(enderecosRoutes)
app.register(etiquetasRoutes)

// health check
app.get('/', async () => ({ status: 'ok' }))

const PORT = Number(process.env.PORT ?? 3000)

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
