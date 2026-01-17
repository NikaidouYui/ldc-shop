import { checkAdmin } from "@/actions/admin"
import { NotificationsContent } from "@/components/admin/notifications-content"
import { getNotificationSettings } from "@/lib/notifications"

export const runtime = 'edge';

export default async function NotificationsPage() {
    await checkAdmin()
    const settings = await getNotificationSettings()

    return (
        <NotificationsContent settings={{
            telegramBotToken: settings.token || '',
            telegramChatId: settings.chatId || ''
        }} />
    )
}
