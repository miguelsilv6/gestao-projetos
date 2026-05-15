-- CreateIndex
CREATE INDEX "Atividade_inqueritoid_dataRealizacao_idx" ON "Atividade"("inqueritoid", "dataRealizacao");

-- CreateIndex
CREATE INDEX "Notificacao_utilizadorId_createdAt_idx" ON "Notificacao"("utilizadorId", "createdAt");

-- CreateIndex
CREATE INDEX "Utilizador_brigadaId_role_idx" ON "Utilizador"("brigadaId", "role");
