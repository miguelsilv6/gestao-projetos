import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

async function main() {
  const chefe = await prisma.utilizador.findUnique({
    where: { email: 'chefe@gpi.pt' },
    select: { id: true, nome: true, role: true, brigadaId: true, ativo: true, tokenVersion: true },
  })
  console.log('chefe:', chefe)

  if (!chefe?.brigadaId) {
    console.log('⚠️ chefe sem brigadaId — buildAtividadePrazoWhere devolve where vazio (0 resultados)')
    return
  }

  // Como a query realmente funciona:
  const where = {
    AND: [
      { dataPrazo: { not: null } },
      { inquerito: { deletedAt: null, estado: { terminal: false } } },
      { inquerito: { brigadaId: chefe.brigadaId } },
    ],
  }
  const items = await prisma.atividade.findMany({
    where,
    select: {
      id: true,
      descricao: true,
      dataPrazo: true,
      utilizadorId: true,
      realizadaPor: { select: { nome: true } },
      inquerito: { select: { nuipc: true, brigadaId: true, estado: { select: { codigo: true, terminal: true } } } },
    },
  })
  console.log(`\nAtividades com dataPrazo na brigada do chefe (${chefe.brigadaId}):`)
  console.log(items.length === 0 ? '  (nenhuma)' : '')
  for (const i of items) {
    console.log(`  - ${i.inquerito.nuipc} | ${i.descricao.slice(0, 40)} | prazo ${i.dataPrazo?.toISOString().slice(0, 10)} | por ${i.realizadaPor.nome}`)
  }

  // Sanity: todas as atividades com dataPrazo no sistema
  const all = await prisma.atividade.findMany({
    where: { dataPrazo: { not: null } },
    select: {
      descricao: true,
      dataPrazo: true,
      utilizadorId: true,
      realizadaPor: { select: { nome: true } },
      inquerito: { select: { nuipc: true, brigadaId: true, estado: { select: { codigo: true, terminal: true } }, deletedAt: true } },
    },
  })
  console.log(`\nTODAS as atividades com dataPrazo no sistema (${all.length}):`)
  for (const i of all) {
    console.log(`  - ${i.inquerito.nuipc} | brigadaId=${i.inquerito.brigadaId} | estado=${i.inquerito.estado.codigo} (terminal=${i.inquerito.estado.terminal}) | deletedAt=${i.inquerito.deletedAt} | por ${i.realizadaPor.nome}`)
  }
}

main().finally(() => prisma.$disconnect())
