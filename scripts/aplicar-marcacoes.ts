import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Aplica as marcacoes de conferencia (etiqueta_wms_erp) feitas na planilha.
// cod_etiqueta marcados com "ok" na coluna etiqueta_wms_erp.
const COD_ETIQUETA_OK_WMS_ERP = [
  20, 21, 22, 23, 26, 27, 28, 30, 32, 34, 35, 41, 46, 47, 48, 49, 50, 51, 55, 58,
  59, 64, 76, 78, 84, 86, 89, 90,
]

async function main() {
  console.log(`Aplicando ${COD_ETIQUETA_OK_WMS_ERP.length} marcacoes em etiqueta_wms_erp...`)

  const res = await prisma.produtoEtiqueta.updateMany({
    where: { cod_etiqueta: { in: COD_ETIQUETA_OK_WMS_ERP } },
    data: { etiqueta_wms_erp: true },
  })

  console.log(`  ${res.count} etiquetas marcadas.`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('Erro:', err)
  await prisma.$disconnect()
  process.exit(1)
})
