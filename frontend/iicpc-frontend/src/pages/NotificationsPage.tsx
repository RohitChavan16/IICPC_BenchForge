import { useQuery } from '@tanstack/react-query'
import { fetchNotifications } from '@/services/api/notificationsService'
import type { NotificationItem } from '@/types/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Bell } from 'lucide-react'

export function NotificationsPage() {
  const { data: notifications } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  })

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Notification center</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Notifications</h1>
      </div>

      <Card title="Recent alerts" description="Platform notifications and action items.">
        <div className="grid gap-4">
          {(notifications ?? []).map((notification) => (
            <div key={notification.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Bell size={16} />
                    <p className="font-semibold text-white">{notification.title}</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{notification.description}</p>
                </div>
                <Badge variant={notification.severity === 'critical' ? 'danger' : notification.severity === 'warning' ? 'warning' : 'success'}>{notification.severity}</Badge>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
