import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'

export async function autenticar(login: string, senha: string) {
  const usuario = await prisma.usuario.findUnique({ where: { login } })

  if (!usuario || !usuario.flg_ativo) {
    throw new Error('Usuário ou senha inválidos')
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
  if (!senhaValida) {
    throw new Error('Usuário ou senha inválidos')
  }

  return {
    id_usuario: usuario.id_usuario,
    nome: usuario.nome,
    login: usuario.login,
  }
}

export async function criarUsuario(nome: string, login: string, senha: string) {
  const senha_hash = await bcrypt.hash(senha, 10)
  return prisma.usuario.create({
    data: { nome, login, senha_hash },
    select: { id_usuario: true, cod_usuario: true, nome: true, login: true },
  })
}
