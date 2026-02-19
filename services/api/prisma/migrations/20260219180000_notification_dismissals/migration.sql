-- Notificări: comenzi „ascunse” de user din lista de notificări (swipe-to-dismiss)
CREATE TABLE "notification_dismissals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_dismissals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_dismissals_user_id_order_id_key" ON "notification_dismissals"("user_id", "order_id");

ALTER TABLE "notification_dismissals" ADD CONSTRAINT "notification_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
