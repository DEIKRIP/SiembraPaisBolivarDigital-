
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, collectionGroup, doc, getDoc, query, where, getDocs, limit, startAt, orderBy, endAt } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Pago, BolivarDigitalClient, Financiamiento } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, User, Briefcase, Calendar, HandCoins, PiggyBank, Search, CreditCard, Loader2, TrendingUp, VenetianMask } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PaymentFormDialog from "./payment-form-dialog";

// Cache for client data to avoid repeated fetches
const clientCache = new Map<string, BolivarDigitalClient>();

async function getCachedClient(clientId: string): Promise<BolivarDigitalClient | null> {
    if (clientCache.has(clientId)) {
        return clientCache.get(clientId) ?? null;
    }
    const docRef = doc(db, 'bolivar_digital_clients', clientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const clientData = { id: docSnap.id, ...docSnap.data() } as BolivarDigitalClient;
        clientCache.set(clientId, clientData);
        return clientData;
    }
    return null;
}


const FinanciamientoActivoCard = ({ financiamiento }: { financiamiento: Financiamiento & { clientName?: string } }) => {
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    
    return (
        <>
        <Card className="bg-muted/30">
            <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center justify-between">
                    <span>{financiamiento.proposito}</span>
                     <Button size="sm" onClick={() => setIsPaymentFormOpen(true)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagar
                    </Button>
                </CardTitle>
                <CardDescription>Sujeto: {financiamiento.clientName || 'Cargando...'}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
                <div className="flex justify-between items-center">
                    <p>Monto: <span className="font-semibold">Bs. {financiamiento.monto.toLocaleString('es-VE')}</span></p>
                    <p>Pagado: <span className="font-semibold text-green-600">Bs. {financiamiento.totalPagado.toLocaleString('es-VE')}</span></p>
                    <Badge variant="outline">{financiamiento.estado}</Badge>
                </div>
            </CardContent>
        </Card>
        <PaymentFormDialog
            isOpen={isPaymentFormOpen}
            setIsOpen={setIsPaymentFormOpen}
            financiamiento={financiamiento}
            clientName={financiamiento.clientName || ''}
        />
        </>
    )
}

const SearchResultCard = ({ client }: { client: BolivarDigitalClient & { financiamientos: Financiamiento[] } }) => {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary"/>
                    {client.fullName}
                </CardTitle>
                <CardDescription>Cédula: {client.cedula} | RIF: {client.rif}</CardDescription>
            </CardHeader>
            <CardContent>
                <h4 className="mb-2 font-medium text-sm text-muted-foreground">Financiamientos Activos</h4>
                <div className="space-y-2">
                    {client.financiamientos.length > 0 ? (
                        client.financiamientos.map(f => <FinanciamientoActivoCard key={f.id} financiamiento={{ ...f, clientName: client.fullName }} />)
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4 bg-muted/20 rounded-md">No tiene financiamientos activos.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


export default function PaymentsModule() {
    const [pagosSnapshot, loadingPagos, errorPagos] = useCollection(query(collectionGroup(db, 'pagos'), orderBy("fecha", "desc")));
    const [financiamientosActivosSnapshot, loadingFinanciamientos] = useCollection(query(collectionGroup(db, 'financiamientos'), where("estado", "in", ['Activo', 'En Seguimiento', 'Cosechado', 'Incumplido'])));
    
    const [pagosConDetalles, setPagosConDetalles] = useState<any[]>([]);
    const [financiamientosActivos, setFinanciamientosActivos] = useState<(Financiamiento & { clientName?: string })[]>([]);

    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<(BolivarDigitalClient & { financiamientos: Financiamiento[] })[]>([]);


    // Fetch details for active financings
    useEffect(() => {
        if (!financiamientosActivosSnapshot) return;

        const fetchFinancingDetails = async () => {
             const financingsData = await Promise.all(
                financiamientosActivosSnapshot.docs.map(async (docSnap) => {
                    const financiamiento = { id: docSnap.id, ...docSnap.data() } as Financiamiento;
                    const clientId = docSnap.ref.parent.parent?.id;
                    if (!clientId) return null;
                    const client = await getCachedClient(clientId);
                    return { ...financiamiento, clientId, clientName: client?.fullName };
                })
             );
             setFinanciamientosActivos(financingsData.filter(Boolean) as (Financiamiento & { clientName?: string })[]);
        };
        fetchFinancingDetails();
    }, [financiamientosActivosSnapshot]);

    const handleSearch = useCallback(async () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        setSearchResults([]);
        try {
            const clientsRef = collection(db, "bolivar_digital_clients");
            const nameQuery = query(clientsRef, orderBy("fullName"), startAt(searchTerm), endAt(searchTerm + '\uf8ff'), limit(5));
            const cedulaQuery = query(clientsRef, orderBy("cedula"), startAt(searchTerm), endAt(searchTerm + '\uf8ff'), limit(5));
            
            const [nameSnap, cedulaSnap] = await Promise.all([getDocs(nameQuery), getDocs(cedulaQuery)]);

            const clientsMap = new Map<string, BolivarDigitalClient>();
            nameSnap.docs.forEach(doc => clientsMap.set(doc.id, { id: doc.id, ...doc.data() } as BolivarDigitalClient));
            cedulaSnap.docs.forEach(doc => clientsMap.set(doc.id, { id: doc.id, ...doc.data() } as BolivarDigitalClient));

            const uniqueClients = Array.from(clientsMap.values());
            const clientsWithFinancings = await Promise.all(uniqueClients.map(async (client) => {
                const financiamientosRef = collection(db, "bolivar_digital_clients", client.id, "financiamientos");
                const financiamientosQuery = query(financiamientosRef, where("estado", "in", ['Activo', 'En Seguimiento', 'Cosechado', 'Incumplido']));
                const financiamientosSnap = await getDocs(financiamientosQuery);
                const financiamientos = financiamientosSnap.docs.map(doc => ({ id: doc.id, clientId: client.id, ...doc.data() } as Financiamiento));
                return { ...client, financiamientos };
            }));

            setSearchResults(clientsWithFinancings);
        } catch (error) {
            console.error("Error searching clients:", error);
        } finally {
            setIsSearching(false);
        }
    }, [searchTerm]);

    // Fetch details for payments history
    useEffect(() => {
        if (loadingPagos || !pagosSnapshot) return;

        const fetchDetails = async () => {
            setIsLoadingDetails(true);
            const dataCache = new Map<string, any>();
            const enhancedPagos = await Promise.all(
                pagosSnapshot.docs.map(async (pagoDoc) => {
                    const pagoData = { id: pagoDoc.id, ...pagoDoc.data() } as Pago;
                    const financiamientoRef = pagoDoc.ref.parent.parent;
                    if (!financiamientoRef) return null;
                    
                    const clientRef = financiamientoRef.parent.parent;
                    if (!clientRef) return null;

                    const getCachedData = async (path: string, id: string) => {
                        const key = `${path}/${id}`;
                        if(dataCache.has(key)) return dataCache.get(key);
                        const data = (await getDoc(doc(db, path, id))).data();
                        dataCache.set(key, data);
                        return data;
                    }

                    const clientData = await getCachedData('bolivar_digital_clients', clientRef.id) as BolivarDigitalClient;
                    const financiamientoData = await getCachedData(clientRef.path + '/financiamientos', financiamientoRef.id) as Financiamiento;
                    return { ...pagoData, clientName: clientData?.fullName || 'Desconocido', proposito: financiamientoData?.proposito || 'N/A' };
                })
            );
            setPagosConDetalles(enhancedPagos.filter(p => p !== null));
            setIsLoadingDetails(false);
        };
        fetchDetails();
    }, [pagosSnapshot, loadingPagos]);

    const financialTotals = useMemo(() => {
        return pagosConDetalles.reduce((acc, pago) => {
            acc.totalIngresos += pago.monto || 0;
            acc.totalRetenido += pago.montoRetenido || 0;
            acc.totalGananciaProductores += pago.gananciaAgricultor || 0;
            return acc;
        }, { totalIngresos: 0, totalRetenido: 0, totalGananciaProductores: 0 });
    }, [pagosConDetalles]);

    const loadingTable = loadingPagos || isLoadingDetails;

    return (
        <div className="h-full flex flex-col gap-8 p-1">
             <Card>
                <CardHeader>
                    <CardTitle>Financiamientos Activos</CardTitle>
                    <CardDescription>Lista de todos los créditos que están actualmente en ciclo de pago. Registre un nuevo pago directamente desde aquí.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loadingFinanciamientos && <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>}
                    {!loadingFinanciamientos && financiamientosActivos.length > 0 && (
                        financiamientosActivos.map(f => <FinanciamientoActivoCard key={f.id} financiamiento={f} />)
                    )}
                    {!loadingFinanciamientos && financiamientosActivos.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">No hay financiamientos activos en este momento.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="flex-grow flex flex-col">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-foreground">Historial y KPIs Financieros</CardTitle>
                    <CardDescription>Registro centralizado de todos los abonos y análisis de la rentabilidad del modelo. También puede buscar un cliente para registrar un pago.</CardDescription>
                     <div className="grid gap-4 md:grid-cols-3 pt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Bs. {financialTotals.totalIngresos.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ganancia SiembraPaís (Retención)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">Bs. {financialTotals.totalRetenido.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ganancia Productores</CardTitle>
                                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">Bs. {financialTotals.totalGananciaProductores.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4">
                     <div>
                        <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar cliente por nombre o cédula para registrar pago..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                         {isSearching && <div className="flex justify-center items-center p-4"><Loader2 className="animate-spin h-6 w-6 text-primary"/></div>}
                         {!isSearching && searchResults.length > 0 && (
                            <div className="space-y-4 mt-4 border-t pt-4">
                                {searchResults.map(client => <SearchResultCard key={client.id} client={client}/>)}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-auto">
                        {loadingTable && <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
                        {!loadingTable && pagosConDetalles.length === 0 && (
                            <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex flex-col justify-center">
                                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium text-foreground">No se han registrado pagos</h3>
                                <p className="mt-1 text-sm text-muted-foreground">El historial de pagos aparecerá aquí.</p>
                            </div>
                        )}
                        {!loadingTable && pagosConDetalles.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead><User className="inline mr-1" />Sujeto</TableHead>
                                        <TableHead><Calendar className="inline mr-1" />Fecha</TableHead>
                                        <TableHead className="text-right"><DollarSign className="inline mr-1" />Monto Total</TableHead>
                                        <TableHead className="text-right"><TrendingUp className="inline mr-1" />Monto Retenido</TableHead>
                                        <TableHead className="text-right"><PiggyBank className="inline mr-1" />Ganancia Productor</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead><Briefcase className="inline mr-1" />Crédito Asociado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pagosConDetalles.map(pago => (
                                        <TableRow key={pago.id}>
                                            <TableCell className="font-medium">{pago.clientName}</TableCell>
                                            <TableCell>{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-semibold text-foreground">Bs. {pago.monto.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right text-primary font-medium">Bs. {(pago.montoRetenido ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right text-green-600 font-medium">Bs. {(pago.gananciaAgricultor ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell><Badge variant="secondary" className="capitalize">{pago.metodo}</Badge></TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{pago.proposito}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
