-- CreateTable
CREATE TABLE "PubSubOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyOrderId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "orderName" TEXT,
    "totalPrice" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "financialStatus" TEXT,
    "test" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PubSubOrder_shop_idx" ON "PubSubOrder"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "PubSubOrder_shopifyOrderId_topic_key" ON "PubSubOrder"("shopifyOrderId", "topic");
