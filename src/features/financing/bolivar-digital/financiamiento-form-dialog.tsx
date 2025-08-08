
"use client";

import { useEffect, useRef, useActionState, useState, useMemo } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { addFinanciamientoAction } from "@/app/bolivarDigitalActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BolivarDigitalClient, FarmerWithParcelas, PrefillFinanciamientoData, Parcela } from "@/lib/types";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Registrando..." : "Registrar Solicitud"}
    </Button>
  );
}

type FinanciamientoFormDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    farmers: (FarmerWithParcelas & { isLinkedToClient: boolean; hasApprovedInspection: boolean; })[];
    loadingFarmers: boolean;
    prefillData?: PrefillFinanciamientoData | null;
}

type ApprovedParcela = {
    id: string;
    name: string;
    montoTotalEstimado?: number;
}

export default function FinanciamientoFormDialog({ isOpen, setIsOpen, farmers, loadingFarmers, prefillData }: FinanciamientoFormDialogProps) {
  const [state, formAction, isPending] = useActionState(addFinanciamientoAction, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedParcelaId, setSelectedParcelaId] = useState<string>('');
  const [monto, setMonto] = useState<number | string>('');
  const [approvedParcelas, setApprovedParcelas] = useState<ApprovedParcela[]>([]);

  const [clientsSnapshot, clientsLoading] = useCollection(collection(db, 'bolivar_digital_clients'));
  
  const clients = useMemo(() => 
    clientsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as BolivarDigitalClient)) || [],
    [clientsSnapshot]
  );
  
  const isPrefilled = !!prefillData?.clientId;

  // Effect to handle pre-filled data
  useEffect(() => {
    if (isOpen && prefillData?.clientId) {
        setSelectedClientId(prefillData.clientId);
        // Reset parcela and monto when client changes
        setSelectedParcelaId('');
        setMonto('');
    } else if (!isOpen) {
        // Reset form when dialog closes
        formRef.current?.reset();
        setSelectedClientId('');
        setApprovedParcelas([]);
        setSelectedParcelaId('');
        setMonto('');
    }
  }, [isOpen, prefillData]);

  useEffect(() => {
    if (isPending) return;

    if (state?.success) {
      toast({
        title: "Éxito",
        description: state.message,
      });
      setIsOpen(false);
    } else if (state?.success === false) {
      toast({
        title: "Error",
        description: state.message ?? "Ocurrió un error.",
        variant: "destructive",
      });
    }
  }, [state, isPending, toast, setIsOpen]);

  // Effect to load approved parcelas for the selected client
  useEffect(() => {
    const fetchParcelas = async () => {
        if (!selectedClientId) {
            setApprovedParcelas([]);
            return;
        }

        const clientDoc = await getDoc(doc(db, "bolivar_digital_clients", selectedClientId));
        const clientData = clientDoc.data();
        if (!clientData || !clientData.farmerId) {
            setApprovedParcelas([]);
            return;
        }

        const parcelasRef = collection(db, 'farmers', clientData.farmerId, 'parcelas');
        const q = query(parcelasRef, where("isLinkedToClient", "==", true));
        const parcelasSnap = await getDocs(q);

        const parcelasWithDetails = await Promise.all(parcelasSnap.docs.map(async (pDoc) => {
            const inspectionsRef = collection(pDoc.ref, "inspections");
            const qInsp = query(inspectionsRef, where("status", "==", "Aprobada"));
            const inspectionsSnap = await getDocs(qInsp);
            
            if (inspectionsSnap.empty) return null;

            const estimacionesRef = collection(pDoc.ref, "estimaciones");
            const estimacionesSnap = await getDocs(estimacionesRef);
            if (estimacionesSnap.empty) return null;

            const estimacion = estimacionesSnap.docs[0];

            return {
                id: pDoc.id,
                name: pDoc.data().name,
                montoTotalEstimado: estimacion.data().montoTotalEstimado
            };
        }));
        
        setApprovedParcelas(parcelasWithDetails.filter(Boolean) as ApprovedParcela[]);
    };

    fetchParcelas();
  }, [selectedClientId, farmers]);

  // Effect to update monto when a parcela is selected
  useEffect(() => {
    const selectedParcela = approvedParcelas.find(p => p.id === selectedParcelaId);
    if (selectedParcela) {
        setMonto(selectedParcela.montoTotalEstimado ?? '');
    }
  }, [selectedParcelaId, approvedParcelas]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Financiamiento</DialogTitle>
          <DialogDescription>
            {isPrefilled 
              ? "Confirme los detalles del financiamiento. El sujeto ha sido pre-cargado. Seleccione la parcela a financiar."
              : "Complete los datos para registrar un nuevo financiamiento. El pago se estructurará por cosechas."
            }
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
            
            <div>
                <Label htmlFor="clientId">Sujeto Productivo</Label>
                <Select name="clientId" required onValueChange={setSelectedClientId} value={selectedClientId} disabled={isPrefilled}>
                    <SelectTrigger id="clientId">
                        <SelectValue placeholder="Seleccione un sujeto..." />
                    </SelectTrigger>
                    <SelectContent>
                        {clientsLoading ? (
                            <SelectItem value="loading" disabled>Cargando...</SelectItem>
                        ) : (
                            clients.map(client => (
                                <SelectItem key={client.id} value={client.id}>{client.fullName}</SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                {state?.errors?.clientId && <p className="text-sm text-destructive mt-1">{state.errors.clientId}</p>}
            </div>

            <div>
                <Label htmlFor="parcelaId">Parcela en Garantía (Aprobada)</Label>
                <Select name="parcelaId" required disabled={!selectedClientId || approvedParcelas.length === 0} value={selectedParcelaId} onValueChange={setSelectedParcelaId}>
                    <SelectTrigger id="parcelaId">
                        <SelectValue placeholder={
                          !selectedClientId ? "Seleccione un sujeto primero" : 
                          approvedParcelas.length === 0 ? "No hay parcelas aprobadas" :
                          "Seleccione una parcela..."
                        } />
                    </SelectTrigger>
                    <SelectContent>
                        {approvedParcelas.map(parcela => (
                            <SelectItem key={parcela.id} value={parcela.id}>{parcela.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {state?.errors?.parcelaId && <p className="text-sm text-destructive mt-1">{state.errors.parcelaId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="monto">Monto (Bs.)</Label>
                  <Input id="monto" name="monto" type="number" step="100" required value={monto} onChange={(e) => setMonto(e.target.value)} readOnly={isPrefilled} />
                  {state?.errors?.monto && <p className="text-sm text-destructive mt-1">{state.errors.monto}</p>}
              </div>
              <div>
                  <Label htmlFor="tasa">Tasa de Retorno (%)</Label>
                  <Input id="tasa" name="tasa" type="number" step="0.5" defaultValue="15" required />
                  {state?.errors?.tasa && <p className="text-sm text-destructive mt-1">{state.errors.tasa}</p>}
              </div>
            </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroCosechas">Nº de Cosechas a Pagar</Label>
                  <Input id="numeroCosechas" name="numeroCosechas" type="number" step="1" required defaultValue="1"/>
                  {state?.errors?.numeroCosechas && <p className="text-sm text-destructive mt-1">{state.errors.numeroCosechas}</p>}
                </div>
            </div>
            
            <div>
                <Label htmlFor="proposito">Propósito del Financiamiento</Label>
                <Textarea id="proposito" name="proposito" placeholder="Ej: Compra de 500kg de semillas de maíz, instalación de sistema de riego..." required />
                {state?.errors?.proposito && <p className="text-sm text-destructive mt-1">{state.errors.proposito}</p>}
            </div>
            
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
