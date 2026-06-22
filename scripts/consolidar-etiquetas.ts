import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Consolida duplicados de produto_etiqueta por (cod_produto, cod_endereco):
// mantem a etiqueta mais recente (dat_cadastro; desempate por cod_etiqueta)
// e apaga as demais. Rodar uma vez antes de criar a constraint unica.
async function main() {
  console.log('Consolidando etiquetas duplicadas (mantem a mais recente)...')

  const removidas = await prisma.$executeRaw`
    DELETE FROM produto_etiqueta a
    USING produto_etiqueta b
    WHERE a.cod_produto = b.cod_produto
      AND a.cod_endereco = b.cod_endereco
      AND (
        a.dat_cadastro < b.dat_cadastro
        OR (a.dat_cadastro = b.dat_cadastro AND a.cod_etiqueta < b.cod_etiqueta)
      )
  `

  console.log(`  ${removidas} etiqueta(s) duplicada(s) removida(s).`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('Erro:', err)
  await prisma.$disconnect()
  process.exit(1)
})
