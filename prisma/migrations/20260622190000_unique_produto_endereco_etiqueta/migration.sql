-- CreateIndex
CREATE UNIQUE INDEX "produto_etiqueta_cod_produto_cod_endereco_key" ON "produto_etiqueta"("cod_produto", "cod_endereco");
