-- AlterTable: marcacoes de conferencia posterior (ok / em branco)
ALTER TABLE "produto_etiqueta" ADD COLUMN "etiqueta_wms_erp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "produto_etiqueta" ADD COLUMN "inventario" BOOLEAN NOT NULL DEFAULT false;
