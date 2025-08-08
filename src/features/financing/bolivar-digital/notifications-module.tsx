
"use client"

import { useState, useEffect, useMemo } from "react";
import { useCollection, useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, collectionGroup, doc, getDoc, query, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Notification as NotificationType, BolivarDigitalClient } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, AlertTriangle, CheckCircle, Info, Handshake, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { markNotificationAsAction } from "@/app/bolivarDigitalActions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const notificationIcons = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    action_required: <Bell className="h-5 w-5 text-indigo-500" />,
};

const notificationStyles = {
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    warning: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    action_required: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800',
};


const NotificationCard = ({ notification, clientName, setActiveTab }: { notification: NotificationType, clientName: string, setActiveTab: (tab: string) => void }) => {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleMarkAsRead = async () => {
        setIsUpdating(true);
        const result = await markNotificationAsAction(notification.clientId, notification.financiamientoId, notification.id);
        if (!result.success) {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        // No toast on success for cleaner UI, the change is reflected visually
        setIsUpdating(false);
    };
    
    const handleGoToFinancing = () => {
        // This is a simple client-side navigation. In a real app with routing, this would be a Link.
        // For now, it just switches the tab. A more robust solution would involve passing the financing ID.
        setActiveTab("loans");
    }

    return (
        <Card className={cn(notification.status === 'unread' ? 'bg-background' : 'bg-muted/50 dark:bg-muted/20', notificationStyles[notification.type])}>
            <CardContent className="p-4 flex items-start gap-4">
                <div className="pt-1">
                    {notificationIcons[notification.type]}
                </div>
                <div className="flex-grow">
                    <p className="text-sm text-foreground mb-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                        Sujeto: <span className="font-medium text-foreground/80">{clientName}</span> | {new Date(notification.createdAt).toLocaleString('es-VE')}
                    </p>
                </div>
                {notification.status === 'unread' && (
                     <Button variant="ghost" size="sm" onClick={handleMarkAsRead} disabled={isUpdating}>
                        <Eye className="mr-2 h-4 w-4" />
                        Marcar como leída
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}


export default function NotificationsModule({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
    const [notificationsSnapshot, loading, error] = useCollection(query(collectionGroup(db, 'notifications'), orderBy("createdAt", "desc")));
    const [clientsSnapshot, clientsLoading] = useCollection(collection(db, 'bolivar_digital_clients'));

    const clientsMap = useMemo(() => {
        if (clientsLoading || !clientsSnapshot) return new Map();
        const map = new Map<string, BolivarDigitalClient>();
        clientsSnapshot.docs.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() } as BolivarDigitalClient));
        return map;
    }, [clientsSnapshot, clientsLoading]);

    const notifications = notificationsSnapshot?.docs.map(doc => {
        const data = doc.data();
        // The path gives us the IDs we need
        const pathSegments = doc.ref.path.split('/');
        // path: bolivar_digital_clients/{clientId}/financiamientos/{financiamientoId}/notifications/{notificationId}
        const clientId = pathSegments[1];
        const financiamientoId = pathSegments[3];
        return {
            id: doc.id,
            ...data,
            clientId,
            financiamientoId,
        } as NotificationType;
    }) || [];

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    return (
        <div className="p-1 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-foreground">Centro de Notificaciones</h3>
                {unreadCount > 0 && <Badge variant="destructive">{unreadCount} Sin Leer</Badge>}
            </div>

            {(loading || clientsLoading) && (
                 <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                 </div>
            )}
            {error && <p className="text-destructive">Error: {error.message}</p>}

            {!loading && !clientsLoading && notifications.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">Bandeja de entrada vacía</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Las alertas y acciones requeridas aparecerán aquí.</p>
                </div>
            )}
            
            <div className="space-y-3">
                {notifications.map(notif => {
                    const clientName = clientsMap.get(notif.clientId)?.fullName || "Sujeto no encontrado";
                    return <NotificationCard key={notif.id} notification={notif} clientName={clientName} setActiveTab={setActiveTab}/>
                })}
            </div>
        </div>
    );
}

    