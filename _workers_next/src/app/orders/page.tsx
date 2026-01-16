import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, reviews } from "@/lib/db/schema"
import { eq, desc, inArray } from "drizzle-orm"
import { redirect } from "next/navigation"
import { OrdersContent } from "@/components/orders-content"
import { cancelExpiredOrders } from "@/lib/db/queries"

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const session = await auth()
    if (!session?.user) redirect('/api/auth/signin')

    try {
        await cancelExpiredOrders({ userId: session.user.id || undefined })
    } catch {
        // Best effort cleanup
    }

    const userOrders = await db.query.orders.findMany({
        where: eq(orders.userId, session.user.id || ''),
        orderBy: [desc(orders.createdAt)]
    })

    // Get reviewed order IDs for delivered orders
    const deliveredOrderIds = userOrders
        .filter((o: any) => o.status === 'delivered')
        .map((o: any) => o.orderId)
    
    let reviewedOrderIds: string[] = []
    if (deliveredOrderIds.length > 0) {
        try {
            const reviewedOrders = await db.select({ orderId: reviews.orderId })
                .from(reviews)
                .where(inArray(reviews.orderId, deliveredOrderIds))
            reviewedOrderIds = reviewedOrders.map(r => r.orderId)
        } catch {
            // Ignore errors (table might not exist)
        }
    }

    return (
        <OrdersContent
            orders={userOrders.map((o: any) => ({
                orderId: o.orderId,
                productId: o.productId,
                productName: o.productName,
                amount: o.amount,
                status: o.status,
                createdAt: o.createdAt,
                canReview: o.status === 'delivered' && !reviewedOrderIds.includes(o.orderId)
            }))}
        />
    )
}
