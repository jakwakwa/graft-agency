-- CreateTable
CREATE TABLE "build_purchases" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "price_id" TEXT NOT NULL,
    "paddle_transaction_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "build_purchases_paddle_transaction_id_key" ON "build_purchases"("paddle_transaction_id");

-- CreateIndex
CREATE INDEX "build_purchases_client_id_price_id_created_at_idx" ON "build_purchases"("client_id", "price_id", "created_at");

-- AddForeignKey
ALTER TABLE "build_purchases" ADD CONSTRAINT "build_purchases_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
