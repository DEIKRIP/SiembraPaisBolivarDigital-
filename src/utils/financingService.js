import { supabase } from './supabase';

const financingService = {
  // Get financings with filters
  getFinancings: async (filters = {}) => {
    try {
      let query = supabase
        .from('financings')
        .select(`
          *,
          farmer:farmers!farmer_cedula(nombre_completo, cedula, risk),
          created_by_profile:user_profiles!created_by(full_name, role)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.estado) {
        query = query.eq('estado', filters.estado);
      }

      if (filters?.farmer_cedula) {
        query = query.eq('farmer_cedula', filters.farmer_cedula);
      }

      if (filters?.min_monto) {
        query = query.gte('monto_solicitado', filters.min_monto);
      }

      if (filters?.max_monto) {
        query = query.lte('monto_solicitado', filters.max_monto);
      }

      if (filters?.nivel_riesgo) {
        query = query.eq('nivel_riesgo', filters.nivel_riesgo);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'No se puede conectar a la base de datos.' 
        };
      }
      return { success: false, error: 'Error al cargar financiamientos' };
    }
  },

  // Get financing by ID
  getFinancing: async (financingId) => {
    try {
      const { data, error } = await supabase
        .from('financings')
        .select(`
          *,
          farmer:farmers!farmer_cedula(*),
          created_by_profile:user_profiles!created_by(full_name, role)
        `)
        .eq('id', financingId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al cargar financiamiento' };
    }
  },

  // Create financing request
  createFinancing: async (financingData) => {
    try {
      const { data, error } = await supabase
        .from('financings')
        .insert([{
          ...financingData,
          estado: 'solicitado',
          fecha_solicitud: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          farmer:farmers!farmer_cedula(nombre_completo, cedula, risk)
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_entity_type: 'financing',
        p_entity_id: data.id,
        p_action: 'created',
        p_details: { 
          monto_solicitado: data.monto_solicitado,
          farmer_cedula: data.farmer_cedula
        }
      });

      // Trigger external automation (webhook simulation)
      // In real implementation, this would call an external service like n8n or Make
      setTimeout(() => {
        financingService.processFinancingAutomation(data.id);
      }, 2000);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al crear solicitud de financiamiento' };
    }
  },

  // Process financing automation (simulates external webhook processing)
  processFinancingAutomation: async (financingId) => {
    try {
      // Get financing details
      const financingResult = await financingService.getFinancing(financingId);
      
      if (!financingResult.success) {
        return financingResult;
      }

      const financing = financingResult.data;
      
      // Simulate risk analysis and decision making
      const riskScore = Math.random();
      const farmerRisk = financing.farmer?.risk || 'medio';
      
      let decision = 'rechazado';
      let montoAprobado = 0;
      let numeroCuotas = 0;
      let tasaInteres = 0;
      
      // Risk-based approval logic
      if (farmerRisk === 'bajo' && riskScore > 0.3) {
        decision = 'aprobado';
        montoAprobado = Math.min(financing.monto_solicitado, financing.monto_solicitado * 0.95);
        numeroCuotas = 12;
        tasaInteres = 8.5;
      } else if (farmerRisk === 'medio' && riskScore > 0.5) {
        decision = 'aprobado';
        montoAprobado = Math.min(financing.monto_solicitado, financing.monto_solicitado * 0.8);
        numeroCuotas = 10;
        tasaInteres = 12.0;
      } else if (farmerRisk === 'alto' && riskScore > 0.8) {
        decision = 'aprobado';
        montoAprobado = Math.min(financing.monto_solicitado, financing.monto_solicitado * 0.6);
        numeroCuotas = 8;
        tasaInteres = 15.5;
      }

      // Update financing with decision
      const updateData = {
        estado: decision,
        nivel_riesgo: farmerRisk,
        updated_at: new Date().toISOString()
      };

      if (decision === 'aprobado') {
        updateData.monto_aprobado = montoAprobado;
        updateData.numero_cuotas = numeroCuotas;
        updateData.tasa_interes = tasaInteres;
        updateData.fecha_aprobacion = new Date().toISOString();
        updateData.condiciones_especiales = `Aprobado automáticamente. Tasa: ${tasaInteres}%, Cuotas: ${numeroCuotas}`;
      }

      const { data, error } = await supabase
        .from('financings')
        .update(updateData)
        .eq('id', financingId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log automation result
      await supabase.rpc('log_activity', {
        p_entity_type: 'financing',
        p_entity_id: financingId,
        p_action: decision,
        p_details: { 
          automation: true,
          monto_aprobado: montoAprobado,
          decision_score: riskScore
        }
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error en procesamiento automático' };
    }
  },

  // Update financing
  updateFinancing: async (financingId, updates) => {
    try {
      const { data, error } = await supabase
        .from('financings')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', financingId)
        .select(`
          *,
          farmer:farmers!farmer_cedula(nombre_completo, cedula)
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_entity_type: 'financing',
        p_entity_id: financingId,
        p_action: 'updated',
        p_details: { fields_updated: Object.keys(updates) }
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al actualizar financiamiento' };
    }
  },

  // Get financing statistics
  getFinancingStats: async () => {
    try {
      const { data, error } = await supabase
        .from('financings')
        .select('estado, monto_solicitado, monto_aprobado, nivel_riesgo');

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        total_requests: data?.length || 0,
        total_solicited: data?.reduce((sum, f) => sum + parseFloat(f.monto_solicitado || 0), 0) || 0,
        total_approved: data?.reduce((sum, f) => sum + parseFloat(f.monto_aprobado || 0), 0) || 0,
        by_status: {},
        by_risk: {}
      };

      // Group by status and risk
      data?.forEach(financing => {
        const estado = financing.estado;
        const riesgo = financing.nivel_riesgo;
        
        stats.by_status[estado] = (stats.by_status[estado] || 0) + 1;
        if (riesgo) {
          stats.by_risk[riesgo] = (stats.by_risk[riesgo] || 0) + 1;
        }
      });

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Error al cargar estadísticas de financiamiento' };
    }
  }
};

export default financingService;