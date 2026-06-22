import { Client } from 'pg'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function conectarOrigem() {
  const client = new Client({ connectionString: process.env.DATABASE_ORIGEM_URL })
  await client.connect()
  return client
}

async function sincronizarProdutos(origem: Client) {
  console.log('Sincronizando produtos...')

  const { rows } = await origem.query<{
    cod_produto: string
    flg_ativo: string | null
    cod_barras: string | null
    referencia_fabricante: string | null
    descricao: string | null
    unidade_saida: string | null
  }>(`
    SELECT cod_produto, flg_ativo, cod_barras, referencia_fabricante, descricao, unidade_saida
    FROM produtos
  `)

  console.log(`  ${rows.length} produtos encontrados`)

  // carga inicial em tabela vazia -> createMany (uma query por lote)
  await prisma.produto.deleteMany()

  const LOTE = 2000
  let inseridos = 0
  for (let i = 0; i < rows.length; i += LOTE) {
    const lote = rows.slice(i, i + LOTE)
    const res = await prisma.produto.createMany({ data: lote, skipDuplicates: true })
    inseridos += res.count
    console.log(`  ${Math.min(i + LOTE, rows.length)}/${rows.length}`)
  }

  console.log(`  ${inseridos} produtos inseridos.`)
}

async function sincronizarEnderecos(origem: Client) {
  console.log('Sincronizando enderecos...')

  const { rows } = await origem.query<{
    cod_endereco: number
    rua: number | null
    predio: number | null
    nivel: number | null
    apto: number | null
    endereco_completo: string | null
  }>(`
    SELECT DISTINCT cod_endereco, rua, predio, nivel, apto, endereco_completo
    FROM estoque_wms_endereco
    WHERE cod_filial = '00'
  `)

  console.log(`  ${rows.length} enderecos encontrados`)

  await prisma.endereco.deleteMany()

  const LOTE = 2000
  let inseridos = 0
  for (let i = 0; i < rows.length; i += LOTE) {
    const lote = rows.slice(i, i + LOTE)
    const res = await prisma.endereco.createMany({ data: lote, skipDuplicates: true })
    inseridos += res.count
    console.log(`  ${Math.min(i + LOTE, rows.length)}/${rows.length}`)
  }

  console.log(`  ${inseridos} enderecos inseridos.`)
}

async function main() {
  console.log('=== Sincronizacao WMS Inventario ===\n')

  const origem = await conectarOrigem()

  try {
    await sincronizarProdutos(origem)
    await sincronizarEnderecos(origem)
    console.log('\n✅ Sincronizacao concluida com sucesso.')
  } finally {
    await origem.end()
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('Erro na sincronizacao:', err)
  process.exit(1)
})
