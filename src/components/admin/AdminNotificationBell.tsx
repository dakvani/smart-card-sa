import { useState } from "react";
import { Bell, Sparkles, ShoppingBag, X, CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  useAdminNotifications,
  type AdminNotification,
} from "@/hooks/use-admin-notifications";
import { cn } from "@/lib/utils";

interface Props {
  isAdmin: boolean;
  onOpenTab: (tab: string) => void;
}

export function AdminNotificationBell({ isAdmin, onOpenTab }: Props) {
  const [open, setOpen] = useState(false);
  const { items, loading, total, proCount, orderCount, dismiss, dismissAll } =
    useAdminNotifications(isAdmin);

  const handleAction = (n: AdminNotification) => {
    onOpenTab(n.kind === "pro_request" ? "pro" : "orders");
    setOpen(false);
  };

  const hasItems = total > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "relative h-8 px-2.5 gap-1.5 text-xs",
            hasItems && "border-primary/40",
          )}
          aria-label={`Notifications${hasItems ? `, ${total} pending` : ""}`}
        >
          <Bell
            className={cn("w-4 h-4", hasItems && "text-primary animate-wiggle")}
          />
          {hasItems && (
            <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground animate-attention">
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[360px] p-0 overflow-hidden border-border/60"
      >
        <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Notifications</span>
            {hasItems && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {total}
              </Badge>
            )}
          </div>
          {hasItems && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] gap-1"
              onClick={dismissAll}
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </div>

        {hasItems && (
          <div className="flex gap-2 px-3 py-1.5 text-[11px] text-muted-foreground border-b border-border/60">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              {proCount} Pro
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-green-500" />
              {orderCount} Orders
            </span>
          </div>
        )}

        <ScrollArea className="max-h-[380px]">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : !hasItems ? (
            <div className="px-4 py-10 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center mb-2">
                <CheckCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="text-xs text-muted-foreground mt-1">
                New requests and orders will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {items.map((n) => {
                const Icon = n.kind === "pro_request" ? Sparkles : ShoppingBag;
                return (
                  <li
                    key={`${n.kind}-${n.id}`}
                    className="px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex gap-2.5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          n.kind === "pro_request"
                            ? "bg-primary/10 text-primary"
                            : "bg-green-500/10 text-green-500",
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {n.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => handleAction(n)}
                          >
                            Review
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px] text-muted-foreground"
                            onClick={() => dismiss(n)}
                            aria-label="Dismiss notification"
                          >
                            <X className="w-3 h-3" /> Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        {hasItems && (
          <>
            <Separator />
            <div className="px-3 py-2 text-[10px] text-muted-foreground text-center bg-muted/30">
              Dismissed items stay hidden for you only. Items reappear if their
              status changes back to pending.
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
