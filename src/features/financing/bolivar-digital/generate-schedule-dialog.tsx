
"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { generateScheduleAction } from "@/app/scheduleActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Financiamiento } from "@/lib/types";
import { CalendarClock } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Generando..." : "Generar Cronograma"}
    </Button>
  );
}

type GenerateScheduleDialogProps = {
    financiamiento: Financiamiento;
}

export default function GenerateScheduleDialog({ financiamiento }: GenerateScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(generateScheduleAction, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  useEffect(() => {
    if (!open) {
        formRef.current?.reset();
    }
  }, [open]);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Éxito",
        description: state.message,
      });
      setOpen(false);
    } else if (state?.success === false) {
      toast({
        title: "Error",
        description: state.message ?? 'Ocurrió un error.',
        variant: "destructive",
      });
    }
  }, [state, toast, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
                <CalendarClock className="mr-2 h-4 w-4"/>
                Generar Cronograma de Pago
            </Button>
        </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Cronograma de Pago</DialogTitle>
          <DialogDescription>
            Introduzca el valor total de la cosecha. El sistema dividirá el monto adeudado en {financiamiento.numeroCosechas} cuota(s) según la frecuencia seleccionada. El monto a pagar será el menor entre el valor de la cosecha y el saldo del crédito.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="clientId" value={financiamiento.clientId} />
            <input type="hidden" name="financiamientoId" value={financiamiento.id} />
            
             <div>
                <Label htmlFor="harvestValue">Valor Total de la Cosecha (Bs.)</Label>
                <Input id="harvestValue" name="harvestValue" type="number" step="100" required />
                {state?.errors?.harvestValue && <p className="text-sm text-destructive mt-1">{state.errors.harvestValue}</p>}
             </div>

             <div>
                <Label htmlFor="frequency">Frecuencia de Pagos</Label>
                 <RadioGroup id="frequency" name="frequency" defaultValue="semanal" className="mt-2">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="semanal" id="frequency-semanal" />
                        <Label htmlFor="frequency-semanal" className="font-normal">Semanal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mensual" id="frequency-mensual" />
                        <Label htmlFor="frequency-mensual" className="font-normal">Mensual</Label>
                    </div>
                </RadioGroup>
                {state?.errors?.frequency && <p className="text-sm text-destructive mt-1">{state.errors.frequency}</p>}
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
