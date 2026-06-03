import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSAR } from "@/lib/currency";

interface OrderNotification {
  id: string;
  order_number: string;
  total: number;
  created_at: string;
}

export function useAdminOrderNotifications(isAdmin: boolean) {
  const { toast } = useToast();
  const [newOrders, setNewOrders] = useState<OrderNotification[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState(false);

  const clearNotifications = useCallback(() => {
    setNewOrders([]);
    setHasNewOrders(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('admin-order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nfc_orders',
        },
        (payload) => {
          const newOrder = payload.new as OrderNotification;
          
          setNewOrders(prev => [...prev, newOrder]);
          setHasNewOrders(true);
          
          toast({
            title: "🛒 New Order!",
            description: `Order #${newOrder.order_number} - ${formatSAR(newOrder.total)}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, toast]);

  return {
    newOrders,
    hasNewOrders,
    notificationCount: newOrders.length,
    clearNotifications,
  };
}
