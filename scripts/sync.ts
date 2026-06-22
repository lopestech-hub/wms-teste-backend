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
  console.log('Sincronizando enderecos (fonte: wms_enderecos)...')

  // a tabela wms_enderecos so tem cod_filial='00' (cadastro completo de enderecos)
  const { rows } = await origem.query<{
    cod_endereco: number
    rua: number | null
    predio: number | null
    nivel: number | null
    apto: number | null
    endereco_completo: string | null
    descricao: string | null
    flg_bloqueado: boolean | null
    situacao: number | null
  }>(`
    SELECT cod_endereco, rua, predio, nivel, apto, endereco_completo,
           descricao, flg_bloqueado, situacao
    FROM wms_enderecos
    WHERE cod_filial = '00'
  `)

  console.log(`  ${rows.length} enderecos encontrados`)

  // enderecos referenciados por etiquetas NAO podem ser deletados (FK)
  const refs = await prisma.produtoEtiqueta.findMany({
    distinct: ['cod_endereco'],
    select: { cod_endereco: true },
  })
  const referenciados = refs.map((r) => r.cod_endereco)
  console.log(`  ${referenciados.length} endereco(s) referenciado(s) por etiquetas (preservados)`)

  // "dropa o antigo" - apaga todos exceto os referenciados
  const del = await prisma.endereco.deleteMany({
    where: referenciados.length ? { cod_endereco: { notIn: referenciados } } : {},
  })
  console.log(`  ${del.count} enderecos antigos removidos`)

  // insere os novos em lote (skipDuplicates pula os referenciados que ficaram)
  const LOTE = 2000
  let inseridos = 0
  for (let i = 0; i < rows.length; i += LOTE) {
    const lote = rows.slice(i, i + LOTE)
    const res = await prisma.endereco.createMany({ data: lote, skipDuplicates: true })
    inseridos += res.count
    if (i % (LOTE * 20) === 0) console.log(`  ${Math.min(i + LOTE, rows.length)}/${rows.length}`)
  }
  console.log(`  ${inseridos} enderecos inseridos.`)

  // atualiza os referenciados com os dados novos (sao poucos)
  let atualizados = 0
  for (const cod of referenciados) {
    const novo = rows.find((r) => r.cod_endereco === cod)
    if (novo) {
      await prisma.endereco.update({ where: { cod_endereco: cod }, data: novo })
      atualizados++
    }
  }
  if (atualizados) console.log(`  ${atualizados} endereco(s) referenciado(s) atualizado(s)`)
}

async function main() {
  // alvo opcional: "produtos" | "enderecos" (default: ambos)
  const alvo = process.argv[2]
  console.log('=== Sincronizacao WMS Inventario ===\n')

  const origem = await conectarOrigem()

  try {
    if (!alvo || alvo === 'produtos') await sincronizarProdutos(origem)
    if (!alvo || alvo === 'enderecos') await sincronizarEnderecos(origem)
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
