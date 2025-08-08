"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench } from "lucide-react";
import { getUsers, updateUserRole, type UserProfile, type UserRole, roleLabels } from "@/lib/supabase";

const UserRow = ({ user, onRoleChange }: { user: UserProfile, onRoleChange: (userId: string, newRole: UserRole) => Promise<void> }) => {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentRole, setCurrentRole] = useState<UserRole>(user.role);

    const handleRoleChange = async (newRole: UserRole) => {
        setIsUpdating(true);
        try {
            await onRoleChange(user.id, newRole);
            setCurrentRole(newRole);
            toast({ 
                title: "Éxito", 
                description: "Rol actualizado correctamente" 
            });
        } catch (error: any) {
            console.error("Error updating role:", error);
            toast({ 
                title: "Error", 
                description: error.message || "Error al actualizar el rol", 
                variant: "destructive" 
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <TableRow>
            <TableCell className="font-medium">{user.full_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
                {isUpdating ? (
                    <span className="text-sm text-muted-foreground">Actualizando...</span>
                ) : (
                    <Select onValueChange={(value) => handleRoleChange(value as UserRole)} value={currentRole}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar rol..." />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(roleLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </TableCell>
        </TableRow>
    );
};

export default function AdminModule() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersData = await getUsers();
            setUsers(usersData);
            setError(null);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err instanceof Error ? err : new Error("Error al cargar los usuarios"));
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        await updateUserRole(userId, newRole);
        // Refresh users after update
        await fetchUsers();
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="p-1">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-foreground">Gestión de Usuarios y Roles</h3>
            </div>
            {loading && <p>Cargando usuarios...</p>}
            {error && <p className="text-destructive">Error: {error.message}</p>}
            {!loading && users.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">No hay usuarios en el sistema</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Los usuarios creados aparecerán aquí para su gestión.</p>
                </div>
            )}
            {!loading && users.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Lista de Usuarios</CardTitle>
                        <CardDescription>Asigna roles a los usuarios para controlar sus permisos en el sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <UserRow 
                                        key={user.id} 
                                        user={user} 
                                        onRoleChange={handleRoleChange}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Dummy components to satisfy the compiler if Card is not directly imported
const Card = ({children}: {children: React.ReactNode}) => <div className="border rounded-lg shadow-sm">{children}</div>;
const CardHeader = ({children}: {children: React.ReactNode}) => <div className="p-6">{children}</div>;
const CardTitle = ({children}: {children: React.ReactNode}) => <h3 className="text-lg font-semibold">{children}</h3>;
const CardDescription = ({children}: {children: React.ReactNode}) => <p className="text-sm text-muted-foreground">{children}</p>;
const CardContent = ({children}: {children: React.ReactNode}) => <div className="p-6 pt-0">{children}</div>;
