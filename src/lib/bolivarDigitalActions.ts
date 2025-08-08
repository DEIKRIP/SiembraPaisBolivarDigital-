import { supabase } from './firebase';

export interface Client {
  id?: string;
  fullName: string;
  cedula: string;
  rif: string;
  phone: string;
  address: string;
  activity: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const deleteClientAction = async (clientId: string): Promise<ActionResponse> => {
  try {
    const { error } = await supabase
      .from('bolivarDigitalClients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;

    return {
      success: true,
      message: 'Cliente eliminado exitosamente',
    };
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    return {
      success: false,
      message: 'Error al eliminar el cliente',
      error: error.message,
    };
  }
};

export const saveClient = async (clientData: any): Promise<ActionResponse> => {
  try {
    const { data, error } = await supabase
      .from('bolivarDigitalClients')
      .upsert([clientData], { onConflict: 'id' });

    if (error) throw error;

    return {
      success: true,
      message: 'Cliente guardado exitosamente',
      data: data?.[0],
    };
  } catch (error: any) {
    console.error('Error al guardar cliente:', error);
    return {
      success: false,
      message: 'Error al guardar el cliente',
      error: error.message,
    };
  }
};

export const getClientById = async (clientId: string): Promise<ActionResponse> => {
  try {
    const { data, error } = await supabase
      .from('bolivarDigitalClients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Cliente obtenido exitosamente',
      data,
    };
  } catch (error: any) {
    console.error('Error al obtener cliente:', error);
    return {
      success: false,
      message: 'Error al obtener el cliente',
      error: error.message,
    };
  }
};
