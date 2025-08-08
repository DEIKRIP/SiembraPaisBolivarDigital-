import { SupabaseClient } from '@supabase/supabase-js';

declare module '@/lib/supabase' {
  export const supabase: SupabaseClient;
  
  export type UserRole = 'admin' | 'operador' | 'productor';
  
  export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    created_at: string;
    updated_at: string;
  }
  
  export const roleLabels: Record<UserRole, string>;
  
  export function getUsers(): Promise<UserProfile[]>;
  export function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean; message: string }>;
  export function getCurrentUser(): Promise<UserProfile | null>;
  
  export default typeof supabase;
}
