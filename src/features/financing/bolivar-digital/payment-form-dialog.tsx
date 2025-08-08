
"use client";

import { useEffect, useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { addPaymentAction } from "@/app/bolivarDigitalActions";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Financiamiento } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Registrando..." : "Registrar Pago"}
    </Button>
  );
}

type PaymentFormDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    financiamiento: Financiamiento;
    clientName: string;
}

export default function PaymentFormDialog({ isOpen, setIsOpen, financiamiento, clientName }: PaymentFormDialogProps) {
  const [state, formAction, isPending] = useActionState(addPaymentAction, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const saldoPendiente = financiamiento.monto - (financiamiento.totalPagado ?? 0);

  useEffect(() => {
    if (!isOpen) {
        formRef.current?.reset();
    }
  }, [isOpen]);

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
        description: state.message ?? 'Ocurrió un error.',
        variant: "destructive",
      });
    }
  }, [state, isPending, toast, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago de Cosecha</DialogTitle>
          <DialogDescription>
            Registrar el ingreso de una venta de cosecha para <strong>{clientName}</strong>. El sistema aplicará la retención correspondiente al crédito.
            <div className="flex justify-between text-sm mt-2 font-medium">
                <span>Monto del crédito: <span className="text-foreground">Bs. {financiamiento.monto.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span></span>
                <span>Saldo Pendiente: <span className="text-primary">Bs. {saldoPendiente.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span></span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="clientId" value={financiamiento.clientId} />
            <input type="hidden" name="financiamientoId" value={financiamiento.id} />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha">Fecha del Pago</Label>
                <Input id="fecha" name="fecha" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                {state?.errors?.fecha && <p className="text-sm text-destructive mt-1">{state.errors.fecha}</p>}
              </div>
              <div>
                  <Label htmlFor="monto">Monto Total Venta (Bs.)</Label>
                  <Input 
                    id="monto" 
                    name="monto" 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="Total de la venta"
                  />
                  {state?.errors?.monto && <p className="text-sm text-destructive mt-1">{state.errors.monto}</p>}
              </div>
            </div>

            <div>
                <Label htmlFor="metodo">Método de Pago</Label>
                <Select name="metodo" required defaultValue="Efectivo">
                    <SelectTrigger id="metodo">
                        <SelectValue placeholder="Seleccione un método..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Patria">Patria</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                </Select>
                {state?.errors?.metodo && <p className="text-sm text-destructive mt-1">{state.errors.metodo}</p>}
            </div>
            
             <div>
                <Label htmlFor="referenciaCosecha">Referencia Cosecha (Opcional)</Label>
                <Textarea id="referenciaCosecha" name="referenciaCosecha" placeholder="Ej: Cosecha de Maíz ciclo invierno 2024" />
                {state?.errors?.referenciaCosecha && <p className="text-sm text-destructive mt-1">{state.errors.referenciaCosecha}</p>}
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
