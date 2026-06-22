import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Uso: tsx --env-file=.env scripts/criar-usuario.ts <nome> <login> <senha>
async function main() {
  const [nome, login, senha] = process.argv.slice(2)

  if (!nome || !login || !senha) {
    console.error('Uso: criar-usuario.ts <nome> <login> <senha>')
    process.exit(1)
  }

  const senha_hash = bcrypt.hashSync(senha, 10)

  const usuario = await prisma.usuario.upsert({
    where: { login },
    update: { nome, senha_hash, flg_ativo: true },
    create: { nome, login, senha_hash },
    select: { cod_usuario: true, nome: true, login: true, flg_ativo: true },
  })

  console.log('Usuário salvo:', JSON.stringify(usuario))
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('Erro:', err)
  await prisma.$disconnect()
  process.exit(1)
})
