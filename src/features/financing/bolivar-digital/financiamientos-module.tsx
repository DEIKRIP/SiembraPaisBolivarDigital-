
"use client";

import { useState, useMemo, useEffect } from "react";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, collectionGroup, query, onSnapshot, doc, getDoc, orderBy } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle, User, Briefcase, Calendar, Hash, Sprout, MoreVertical, CreditCard, PiggyBank, Trash2, CheckCircle, ChevronDown, ListOrdered, ShieldCheck } from "lucide-react";
import { db } from "@/lib/firebase";
import FinanciamientoFormDialog from "./financiamiento-form-dialog";
import PaymentFormDialog from "./payment-form-dialog";
import type { Financiamiento, FarmerWithParcelas, FinanciamientoStatus, Pago, Parcela, ScheduleItem, Notification, PrefillFinanciamientoData, QualityControl } from "@/lib/types";
import { validTransitions } from "@/lib/workflow";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { deleteFinanciamientoAction, updateFinanciamientoStatusAction, approveFinanciamientoAction } from "@/app/bolivarDigitalActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import FinanciamientoChecklist from "./financiamiento-checklist";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import GenerateScheduleDialog from "./generate-schedule-dialog";
import QualityControlDialog from "./quality-control-dialog";

const StatusActions = ({ financiamiento, parcelaGarantia }: { financiamiento: Financiamiento; parcelaGarantia: Parcela | null | undefined; }) => {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    let possibleNextStates = validTransitions[financiamiento.estado] || [];
    const hasApprovedInspection = parcelaGarantia?.inspections?.some(i => i.status === 'Aprobada');

    const handleUpdateStatus = async (newStatus: FinanciamientoStatus) => {
        setIsUpdating(true);
        const result = await updateFinanciamientoStatusAction(
            financiamiento.clientId,
            financiamiento.id,
            financiamiento.estado,
            newStatus
        );

        if (result.success) {
            toast({ title: "Éxito", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsUpdating(false);
    }
    
    const handleApprove = async () => {
        setIsUpdating(true);
        const result = await approveFinanciamientoAction(financiamiento.clientId, financiamiento.id);
         if (result.success) {
            toast({ title: "Éxito", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsUpdating(false);
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteFinanciamientoAction(financiamiento.clientId, financiamiento.id);
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsDeleting(false);
        setIsAlertOpen(false);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isUpdating || isDeleting}>
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {financiamiento.estado === 'Verificación de Garantía' && hasApprovedInspection && (
                        <DropdownMenuItem onClick={handleApprove} disabled={isUpdating}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                           {isUpdating ? "Aprobando..." : `Aprobar Financiamiento`}
                        </DropdownMenuItem>
                    )}

                    {possibleNextStates.map(status => (
                        <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(status)} disabled={isUpdating}>
                           {isUpdating ? "Actualizando..." : `Mover a: ${status}`}
                        </DropdownMenuItem>
                    ))}
                    {(possibleNextStates.length > 0 || (financiamiento.estado === 'Verificación de Garantía' && hasApprovedInspection)) && <DropdownMenuSeparator />}
                    
                    <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => setIsAlertOpen(true)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el financiamiento. Si ya tiene pagos, la eliminación podría fallar.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

const AmortizationSchedule = ({ financiamiento }: { financiamiento: Financiamiento }) => {
    
    const [scheduleItems, setScheduleItems] = useState(financiamiento.schedule || []);

     useEffect(() => {
        // This effect runs on the client to check for overdue items without changing DB
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        
        const updatedSchedule = (financiamiento.schedule || []).map(item => {
            const dueDate = new Date(item.fechaVencimiento);
            if (item.estado === 'Pendiente' && dueDate < today) {
                // This is a visual-only update. The backend handles persistent state changes.
                return { ...item, estado: 'Atrasada' as const };
            }
            return item;
        });
        setScheduleItems(updatedSchedule);
    }, [financiamiento.schedule]);


    const scheduleStatusConfig: Record<ScheduleItem['estado'], string> = {
        'Pendiente': 'bg-yellow-100 text-yellow-800',
        'Pagada': 'bg-green-100 text-green-800',
        'Atrasada': 'bg-red-100 text-red-800',
        'Pagada Parcialmente': 'bg-blue-100 text-blue-800'
    };

    if (scheduleItems.length === 0) {
        return (
             <div className="text-center text-sm text-muted-foreground py-4">
                El cronograma de pagos se genera post-cosecha.
            </div>
        )
    }

    return (
        <div className="max-h-60 overflow-y-auto">
            <Table>
                <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                        <TableHead className="w-[80px]">Cuota</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {scheduleItems.sort((a,b) => a.nroCuota - b.nroCuota).map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.nroCuota}</TableCell>
                            <TableCell>{new Date(item.fechaVencimiento).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn("border-transparent", scheduleStatusConfig[item.estado])}>
                                    {item.estado}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">Bs. {item.montoCuota.toLocaleString('es-VE', {minimumFractionDigits: 2})}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

const FinanciamientoCard = ({ financiamiento, clientName, farmers, loadingFarmers, clientsMap }: { financiamiento: Financiamiento; clientName: string; farmers: (FarmerWithParcelas & { clients?: any[], parcelas: (Parcela & { qualityControls?: QualityControl[]})[] } )[]; loadingFarmers: boolean; clientsMap: Map<string, { fullName: string; farmerId?: string; }>}) => {
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    
    // Encuentra la parcela de garantía para la lógica de aprobación
    const parcelaGarantia = useMemo(() => {
        if (loadingFarmers || !financiamiento.clientId) return null;
        
        const clientData = farmers.find(f => f.clients?.some(c => c.id === financiamiento.clientId));

        if(clientData){
             const parcela = clientData.parcelas.find(p => p.id === financiamiento.parcelaId);
             return parcela;
        }
        return null;

    }, [financiamiento, farmers, loadingFarmers]);

    const statusConfig: Record<Financiamiento['estado'], string> = {
        'Solicitud': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'Pre-Aprobado': 'bg-blue-100 text-blue-800 border-blue-200',
        'Verificación de Garantía': 'bg-cyan-100 text-cyan-800 border-cyan-200',
        'Aprobado': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'Operativo Instalado': 'bg-purple-100 text-purple-800 border-purple-200',
        'Activo': 'bg-green-100 text-green-800 border-green-200',
        'En Seguimiento': 'bg-lime-100 text-lime-800 border-lime-200',
        'Cosechado': 'bg-teal-100 text-teal-800 border-teal-200',
        'Pagado': 'bg-gray-100 text-gray-800 border-gray-200',
        'Incumplido': 'bg-orange-100 text-orange-800 border-orange-200',
        'Cancelado': 'bg-slate-100 text-slate-800 border-slate-200',
        'Rechazado': 'bg-red-100 text-red-800 border-red-200',
    };
    
    const canReceivePayment = ['Activo', 'En Seguimiento', 'Cosechado', 'Incumplido'].includes(financiamiento.estado) && financiamiento.schedule && financiamiento.schedule.length > 0;
    const canGenerateSchedule = financiamiento.estado === 'Cosechado' && (!financiamiento.schedule || financiamiento.schedule.length === 0);
    const canPerformQualityControl = financiamiento.estado === 'Activo' && financiamiento.parcelaId && clientsMap.get(financiamiento.clientId)?.farmerId;

    return (
        <>
        <Card className="flex flex-col">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                     <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" />
                            Financiamiento
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-2">
                            <User className="h-4 w-4" />
                            {clientName}
                        </CardDescription>
                     </div>
                    <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusConfig[financiamiento.estado]}`}>
                            {financiamiento.estado}
                        </span>
                        <StatusActions financiamiento={financiamiento} parcelaGarantia={parcelaGarantia} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3 flex-grow">
                 <div className="space-y-2">
                    <p className="flex items-center gap-2"><strong className="text-base">Monto:</strong> Bs. {financiamiento.monto.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                    <p className="flex items-center gap-2"><PiggyBank className="h-4 w-4" /> <strong>Pagado:</strong> <span className="font-semibold text-green-600">Bs. {(financiamiento.totalPagado ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span></p>
                    <p className="flex items-start gap-2"><Sprout className="h-4 w-4 mt-1" /> <strong>Propósito:</strong> {financiamiento.proposito}</p>
                </div>
                
                <div className="pt-2">
                    <FinanciamientoChecklist financiamiento={financiamiento} parcelaGarantia={parcelaGarantia} />
                </div>
            
                <Accordion type="single" collapsible className="w-full pt-2">
                    <AccordionItem value="schedule">
                        <AccordionTrigger className="text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <ListOrdered className="h-4 w-4" />
                                Cronograma de Pagos
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                           <AmortizationSchedule financiamiento={financiamiento} />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-2">
                {canReceivePayment && (
                    <Button className="w-full" onClick={() => setIsPaymentFormOpen(true)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Añadir Pago
                    </Button>
                )}
                 {canGenerateSchedule && (
                   <GenerateScheduleDialog financiamiento={financiamiento} />
                )}
                 {canPerformQualityControl && (
                    <QualityControlDialog farmerId={clientsMap.get(financiamiento.clientId)?.farmerId!} parcelaId={financiamiento.parcelaId} />
                )}
            </CardFooter>
        </Card>
        <PaymentFormDialog 
            isOpen={isPaymentFormOpen} 
            setIsOpen={setIsPaymentFormOpen} 
            financiamiento={financiamiento}
            clientName={clientName}
        />
        </>
    )
}

type FinanciamientosModuleProps = {
    farmers: (FarmerWithParcelas & { isLinkedToClient: boolean; hasApprovedInspection: boolean; })[];
    loadingFarmers: boolean;
    prefillData: PrefillFinanciamientoData | null;
    clearPrefillData: () => void;
}

export default function FinanciamientosModule({ farmers, loadingFarmers, prefillData, clearPrefillData }: FinanciamientosModuleProps) {
  const [financiamientosSnapshot, loading, error] = useCollection(query(collectionGroup(db, 'financiamientos')));
  const [clientsSnapshot, clientsLoading] = useCollection(collection(db, 'bolivar_digital_clients'));
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const clientsMap = useMemo(() => {
    const map = new Map<string, { fullName: string, farmerId?: string }>();
    clientsSnapshot?.docs.forEach(doc => {
      const data = doc.data();
      map.set(doc.id, { fullName: data.fullName, farmerId: data.farmerId });
    });
    return map;
  }, [clientsSnapshot]);


  const [dataMap, setDataMap] = useState<Map<string, { pagos: Pago[], schedule: ScheduleItem[], notifications: Notification[] }>>(new Map());

  // Effect to handle prefill data
  useEffect(() => {
    if (prefillData) {
      setIsFormOpen(true);
    }
  }, [prefillData]);
  
  // Clean up prefill data when dialog closes
  useEffect(() => {
    if (!isFormOpen) {
        clearPrefillData();
    }
  }, [isFormOpen, clearPrefillData]);


  // Effect to fetch subcollections for all financings
  useEffect(() => {
    if (!financiamientosSnapshot) return;

    const unsubscribes = financiamientosSnapshot.docs.map(financiamientoDoc => {
        const clientId = financiamientoDoc.ref.parent.parent?.id;
        if (!clientId) return () => {};

        const financiamientoRef = doc(db, "bolivar_digital_clients", clientId, "financiamientos", financiamientoDoc.id);
        const pagosQuery = query(collection(financiamientoRef, "pagos"));
        const scheduleQuery = query(collection(financiamientoRef, "schedule"), orderBy("nroCuota"));
        const notificationsQuery = query(collection(financiamientoRef, "notifications"));
        
        const unsubPagos = onSnapshot(pagosQuery, (pagosSnapshot) => {
            const pagos = pagosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pago));
            setDataMap(prevMap => {
                const currentData = prevMap.get(financiamientoDoc.id) || { pagos: [], schedule: [], notifications: [] };
                return new Map(prevMap).set(financiamientoDoc.id, { ...currentData, pagos });
            });
        });

        const unsubSchedule = onSnapshot(scheduleQuery, (scheduleSnapshot) => {
            let schedule = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem));
            setDataMap(prevMap => {
                const currentData = prevMap.get(financiamientoDoc.id) || { pagos: [], schedule: [], notifications: [] };
                return new Map(prevMap).set(financiamientoDoc.id, { ...currentData, schedule });
            });
        });

        const unsubNotifications = onSnapshot(notificationsQuery, (notificationsSnapshot) => {
            const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setDataMap(prevMap => {
                const currentData = prevMap.get(financiamientoDoc.id) || { pagos: [], schedule: [], notifications: [] };
                return new Map(prevMap).set(financiamientoDoc.id, { ...currentData, notifications });
            });
        });


        return () => {
          unsubPagos();
          unsubSchedule();
          unsubNotifications();
        }
    });

    return () => {
        unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [financiamientosSnapshot]);

  const allFinanciamientos: Financiamiento[] = useMemo(() => 
    financiamientosSnapshot?.docs.map(doc => {
      const clientId = doc.ref.parent.parent?.id || 'unknown';
      const data = doc.data();
      const subcollections = dataMap.get(doc.id) || { pagos: [], schedule: [], notifications: [] };
      return { 
        id: doc.id, 
        clientId, 
        ...data,
        monto: data.monto || 0,
        plazo: data.plazo || 0,
        tasa: data.tasa || 0,
        proposito: data.proposito || '',
        fechaSolicitud: data.fechaSolicitud || new Date().toISOString(),
        estado: data.estado || 'Solicitud',
        totalPagado: data.totalPagado || 0,
        numeroCosechas: data.numeroCosechas || 0,
        pagos: subcollections.pagos,
        schedule: subcollections.schedule,
        notifications: subcollections.notifications,
       } as Financiamiento;
    }).sort((a,b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()) || [],
    [financiamientosSnapshot, dataMap]
  );
  
  // Enrich farmers with client data for easier lookup
  const farmersWithClients = useMemo(() => {
    if (loadingFarmers || clientsLoading) return [];
    return farmers.map(farmer => {
        const relatedClients = Array.from(clientsMap.entries())
            .filter(([clientId, clientData]) => clientData.farmerId === farmer.id)
            .map(([clientId, clientData]) => ({ id: clientId, ...clientData }));
        
        const parcelasWithQC = farmer.parcelas.map(p => {
            // This is a placeholder for a more reactive sub-collection fetch
            // In a real scenario, you'd fetch this reactively as well.
            return {...p, qualityControls: []}
        })

        return { ...farmer, clients: relatedClients, parcelas: parcelasWithQC };
    });
  }, [farmers, clientsMap, loadingFarmers, clientsLoading]);


  return (
    <div className="p-1">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold text-foreground">Gestión de Financiamientos</h3>
            <Button onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Añadir Financiamiento
            </Button>
        </div>
        
        {(loading || clientsLoading || loadingFarmers) && <p>Cargando financiamientos...</p>}
        {error && <p className="text-destructive">Error: {error.message}</p>}

        {!loading && !clientsLoading && !loadingFarmers && allFinanciamientos.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No hay financiamientos registrados</h3>
                <p className="mt-1 text-sm text-muted-foreground">Empiece por añadir la primera solicitud de financiamiento.</p>
                <div className="mt-6">
                    <Button onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Financiamiento
                    </Button>
                </div>
            </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allFinanciamientos.map(f => {
                const clientName = clientsMap.get(f.clientId)?.fullName || 'Sujeto Desconocido';
                return (
                    <FinanciamientoCard 
                        key={f.id} 
                        financiamiento={f}
                        clientName={clientName}
                        farmers={farmersWithClients}
                        loadingFarmers={loadingFarmers || clientsLoading}
                        clientsMap={clientsMap}
                    />
                );
            })}
        </div>
        
        <FinanciamientoFormDialog 
            isOpen={isFormOpen} 
            setIsOpen={setIsFormOpen}
            farmers={farmers}
            loadingFarmers={loadingFarmers}
            prefillData={prefillData}
        />
    </div>
  );
}

    