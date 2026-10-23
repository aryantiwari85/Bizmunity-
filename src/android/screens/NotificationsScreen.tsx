import React from 'react';
import { ArrowLeft, Bell, Check, CheckCheck } from 'lucide-react';
import { NotificationItem } from '../../types/bizmunity';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../../firebase/firestoreService';

interface NotificationsScreenProps {
  notifications: NotificationItem[];
  onGoBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications,
  onGoBack,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white">
      {/* Top App Bar */}
      <div className="h-12 px-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <button onClick={onGoBack} className="p-1 text-zinc-600 dark:text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="font-bold text-xs">Notifications</h2>

        {unreadCount > 0 ? (
          <button
            onClick={() => markAllNotificationsAsRead(notifications)}
            className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark read
          </button>
        ) : (
          <div className="w-5" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/80 dark:divide-zinc-800/80 pb-16">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-xs text-zinc-400 space-y-2">
            <Bell className="w-8 h-8 text-orange-500/50 mx-auto" />
            <p className="font-bold text-zinc-700 dark:text-zinc-300">All caught up!</p>
            <p className="text-[11px]">When people like your posts or join your circles, you'll see alerts here.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markNotificationAsRead(item.id)}
              className={`p-4 flex gap-3 text-xs transition cursor-pointer ${
                item.read
                  ? 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400'
                  : 'bg-orange-50/60 dark:bg-orange-950/20 text-zinc-900 dark:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                {item.actorAvatar ? (
                  <img src={item.actorAvatar} alt={item.actorName} className="w-full h-full object-cover" />
                ) : (
                  item.actorName.charAt(0)
                )}
              </div>

              <div className="flex-1">
                <p className="font-bold">{item.title}</p>
                <p className="text-zinc-600 dark:text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed">
                  {item.message}
                </p>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {!item.read && (
                <div className="w-2 h-2 rounded-full bg-orange-500 self-center shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
