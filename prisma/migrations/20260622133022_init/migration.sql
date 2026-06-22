-- CreateTable
CREATE TABLE "produto" (
    "cod_produto" VARCHAR(20) NOT NULL,
    "flg_ativo" VARCHAR(5),
    "cod_barras" VARCHAR(50),
    "referencia_fabricante" VARCHAR(50),
    "descricao" VARCHAR(200),
    "unidade_saida" VARCHAR(10),

    CONSTRAINT "produto_pkey" PRIMARY KEY ("cod_produto")
);

-- CreateTable
CREATE TABLE "endereco" (
    "cod_endereco" INTEGER NOT NULL,
    "rua" INTEGER,
    "predio" INTEGER,
    "nivel" INTEGER,
    "apto" INTEGER,
    "endereco_completo" VARCHAR(40),

    CONSTRAINT "endereco_pkey" PRIMARY KEY ("cod_endereco")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" UUID NOT NULL,
    "cod_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "login" VARCHAR(50) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "flg_ativo" BOOLEAN NOT NULL DEFAULT true,
    "dat_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "produto_etiqueta" (
    "id_etiqueta" UUID NOT NULL,
    "cod_etiqueta" SERIAL NOT NULL,
    "cod_produto" VARCHAR(20) NOT NULL,
    "cod_barras" VARCHAR(50) NOT NULL,
    "cod_endereco" INTEGER NOT NULL,
    "qtd_inventario" DECIMAL(10,3) NOT NULL,
    "id_usuario" UUID NOT NULL,
    "dat_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produto_etiqueta_pkey" PRIMARY KEY ("id_etiqueta")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- AddForeignKey
ALTER TABLE "produto_etiqueta" ADD CONSTRAINT "produto_etiqueta_cod_produto_fkey" FOREIGN KEY ("cod_produto") REFERENCES "produto"("cod_produto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_etiqueta" ADD CONSTRAINT "produto_etiqueta_cod_endereco_fkey" FOREIGN KEY ("cod_endereco") REFERENCES "endereco"("cod_endereco") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_etiqueta" ADD CONSTRAINT "produto_etiqueta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
