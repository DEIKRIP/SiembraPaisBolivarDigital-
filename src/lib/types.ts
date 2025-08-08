import { Farmer } from "@/types/farmer";

export interface FarmerWithParcelas extends Farmer {
  parcelas?: any[]; // Reemplaza 'any' con el tipo correcto de parcela si lo tienes
  isLinkedToClient: boolean;
  hasApprovedInspection: boolean;
}

export interface PrefillFinanciamientoData {
  farmerId: string | number;
  farmerName: string;
  // Agrega más campos según sea necesario
}
