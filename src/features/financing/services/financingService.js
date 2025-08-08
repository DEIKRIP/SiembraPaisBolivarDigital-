import { supabase } from '@/utils/supabase';

// Obtener todos los financiamientos
const getFinanciamientos = async () => {
  try {
    const { data, error } = await supabase
      .from('financiamientos')
      .select(`
        *,
        cliente:cliente_id (*)
      `)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener financiamientos:', error);
    return { data: null, error };
  }
};

// Obtener un financiamiento por ID
const getFinanciamientoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('financiamientos')
      .select(`
        *,
        cliente:cliente_id (*),
        pagos (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener el financiamiento:', error);
    return { data: null, error };
  }
};

// Crear un nuevo financiamiento
const createFinanciamiento = async (financiamientoData) => {
  try {
    const { data, error } = await supabase
      .from('financiamientos')
      .insert([financiamientoData])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al crear financiamiento:', error);
    return { data: null, error };
  }
};

// Actualizar un financiamiento existente
const updateFinanciamiento = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('financiamientos')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error al actualizar financiamiento:', error);
    return { data: null, error };
  }
};

// Eliminar un financiamiento
const deleteFinanciamiento = async (id) => {
  try {
    const { error } = await supabase
      .from('financiamientos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error al eliminar financiamiento:', error);
    return { error };
  }
};

// Suscribirse a cambios en la tabla de financiamientos
const subscribeToFinanciamientos = (callback) => {
  const subscription = supabase
    .channel('financiamientos-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'financiamientos' },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

export {
  getFinanciamientos,
  getFinanciamientoById,
  createFinanciamiento,
  updateFinanciamiento,
  deleteFinanciamiento,
  subscribeToFinanciamientos
};
