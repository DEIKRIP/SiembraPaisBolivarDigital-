import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'operador' | 'productor';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  productor: 'Productor'
};

// Function to fetch all users with their roles
export async function getUsers(): Promise<UserProfile[]> {
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('*');
    
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  
  return users || [];
}

// Function to update a user's role
export async function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ 
      role: role, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId);
    
  if (error) {
    console.error('Error updating user role:', error);
    return { success: false, message: error.message };
  }
  
  return { success: true, message: 'Rol actualizado exitosamente' };
}

// Function to get the current user's profile
export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return profile;
}

export default supabase;
