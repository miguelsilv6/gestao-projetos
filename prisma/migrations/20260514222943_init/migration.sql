-- CreateEnum
CREATE TYPE "Role" AS ENUM ('INSPETOR', 'INSPETOR_CHEFE', 'COORDENADOR', 'ESTATISTICA', 'ADMINISTRACAO');

-- CreateEnum
CREATE TYPE "EstadoInquerito" AS ENUM ('ABERTO', 'EM_INVESTIGACAO', 'SUSPENSO', 'CONCLUIDO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "FaseProcessual" AS ENUM ('INQUERITO', 'INSTRUCAO', 'JULGAMENTO', 'RECURSO', 'TRANSITO_EM_JULGADO');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('PRAZO_APROXIMANDO', 'PRAZO_ULTRAPASSADO', 'ATIVIDADE_ADICIONADA', 'INQUERITO_ATRIBUIDO', 'INQUERITO_TRANSFERIDO');

-- CreateTable
CREATE TABLE "Brigada" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brigada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilizador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "chefeSupremo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brigadaId" TEXT,

    CONSTRAINT "Utilizador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquerito" (
    "id" TEXT NOT NULL,
    "nuipc" TEXT NOT NULL,
    "natureza" TEXT NOT NULL,
    "estado" "EstadoInquerito" NOT NULL DEFAULT 'ABERTO',
    "faseProcessual" "FaseProcessual" NOT NULL DEFAULT 'INQUERITO',
    "dataAbertura" TIMESTAMP(3) NOT NULL,
    "dataPrazo" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brigadaId" TEXT NOT NULL,
    "inspetorId" TEXT,

    CONSTRAINT "Inquerito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atividade" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataRealizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inqueritoid" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,

    CONSTRAINT "Atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "emailEnviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilizadorId" TEXT NOT NULL,
    "inqueritoid" TEXT,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "utilizadorId" TEXT NOT NULL,
    "detalhes" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoSistema" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "backupScheduleCron" TEXT NOT NULL DEFAULT '0 2 * * *',
    "prazoAlertaDias" INTEGER NOT NULL DEFAULT 7,
    "emailRemetenteNome" TEXT NOT NULL DEFAULT 'GPI Sistema',
    "emailRemetenteAddr" TEXT NOT NULL DEFAULT 'noreply@gpi.pt',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoSistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "utilizadorId" TEXT NOT NULL,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Brigada_nome_key" ON "Brigada"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Utilizador_email_key" ON "Utilizador"("email");

-- CreateIndex
CREATE INDEX "Utilizador_brigadaId_idx" ON "Utilizador"("brigadaId");

-- CreateIndex
CREATE INDEX "Utilizador_role_idx" ON "Utilizador"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Inquerito_nuipc_key" ON "Inquerito"("nuipc");

-- CreateIndex
CREATE INDEX "Inquerito_brigadaId_idx" ON "Inquerito"("brigadaId");

-- CreateIndex
CREATE INDEX "Inquerito_inspetorId_idx" ON "Inquerito"("inspetorId");

-- CreateIndex
CREATE INDEX "Inquerito_estado_idx" ON "Inquerito"("estado");

-- CreateIndex
CREATE INDEX "Inquerito_faseProcessual_idx" ON "Inquerito"("faseProcessual");

-- CreateIndex
CREATE INDEX "Inquerito_dataPrazo_idx" ON "Inquerito"("dataPrazo");

-- CreateIndex
CREATE INDEX "Inquerito_nuipc_idx" ON "Inquerito"("nuipc");

-- CreateIndex
CREATE INDEX "Atividade_inqueritoid_idx" ON "Atividade"("inqueritoid");

-- CreateIndex
CREATE INDEX "Atividade_utilizadorId_idx" ON "Atividade"("utilizadorId");

-- CreateIndex
CREATE INDEX "Notificacao_utilizadorId_lida_idx" ON "Notificacao"("utilizadorId", "lida");

-- CreateIndex
CREATE INDEX "Notificacao_createdAt_idx" ON "Notificacao"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entidade_entidadeId_idx" ON "AuditLog"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "AuditLog_utilizadorId_idx" ON "AuditLog"("utilizadorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_sessionToken_key" ON "Sessao"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Utilizador" ADD CONSTRAINT "Utilizador_brigadaId_fkey" FOREIGN KEY ("brigadaId") REFERENCES "Brigada"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquerito" ADD CONSTRAINT "Inquerito_brigadaId_fkey" FOREIGN KEY ("brigadaId") REFERENCES "Brigada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquerito" ADD CONSTRAINT "Inquerito_inspetorId_fkey" FOREIGN KEY ("inspetorId") REFERENCES "Utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_inqueritoid_fkey" FOREIGN KEY ("inqueritoid") REFERENCES "Inquerito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Atividade" ADD CONSTRAINT "Atividade_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_inqueritoid_fkey" FOREIGN KEY ("inqueritoid") REFERENCES "Inquerito"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "Utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
