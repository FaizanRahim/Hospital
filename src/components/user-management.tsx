
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFormState } from 'react-dom';
import { collection, getDocs, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from './ui/card';
import { Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { updateUserRole } from '../lib/actions/user-actions';
import { useToast } from '../hooks/use-toast';
import { useUserProfile } from '../context/user-profile-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';


interface UserProfile extends DocumentData {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin' | 'super_admin';
  firstName?: string;
  lastName?: string;
}

function RoleSelector({
  userId,
  currentRole,
  currentUserProfile,
  onRoleUpdate,
}: {
  userId: string;
  currentRole: UserProfile['role'];
  currentUserProfile: DocumentData | null;
  onRoleUpdate: () => void;
}) {
  const { toast } = useToast();
  const [state, formAction] = useFormState(updateUserRole, { status: 'idle' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserProfile['role'] | null>(null);

  const handleConfirm = () => {
    if (pendingRole) {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('newRole', pendingRole);
      formAction(formData);
    }
  };

  useEffect(() => {
    if (state.status === 'success') {
      toast({ title: "Success", description: "User role updated successfully." });
      onRoleUpdate();
      setDialogOpen(false);
      setPendingRole(null);
    } else if (state.status === 'error') {
      toast({ variant: "destructive", title: "Error", description: state.error });
      setDialogOpen(false);
      setPendingRole(null);
    }
  }, [state, toast, onRoleUpdate]);

  const isCurrentUserSuperAdmin = currentUserProfile?.role === 'super_admin';
  const isTargetSuperAdmin = currentRole === 'super_admin';
  // Disable if the current user isn't a super admin and is trying to edit a super admin
  // OR if the user is trying to edit their own role.
  const isDisabled = (isTargetSuperAdmin && !isCurrentUserSuperAdmin) || currentUserProfile?.uid === userId;

  return (
    <AlertDialog open={dialogOpen} onOpenChange={(isOpen) => {
        setDialogOpen(isOpen);
        if (!isOpen) {
            setPendingRole(null);
        }
    }}>
      <Select
        onValueChange={(newRole: UserProfile['role']) => {
          if (newRole !== currentRole) {
            setPendingRole(newRole);
            setDialogOpen(true);
          }
        }}
        value={currentRole}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="patient">Patient</SelectItem>
          <SelectItem value="doctor">Doctor</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          {isCurrentUserSuperAdmin && (
            <SelectItem value="super_admin">Super Admin</SelectItem>
          )}
        </SelectContent>
      </Select>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will change the user&apos;s role to <span className="font-bold text-foreground">{pendingRole}</span>, altering their permissions across the application. This action cannot be easily undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setPendingRole(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleConfirm}>Continue</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


export function UserManagement() {
  const { userProfile: currentUserProfile } = useUserProfile();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserProfile[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <>
      <div className="md:hidden grid gap-4">
        {users.map((user) => (
            <Card key={user.id}>
                <CardHeader>
                    <CardTitle className="text-lg truncate">{user.email}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'}>
                        {user.role}
                    </Badge>
                     <RoleSelector
                          userId={user.id}
                          currentRole={user.role}
                          currentUserProfile={currentUserProfile}
                          onRoleUpdate={fetchUsers}
                        />
                </CardContent>
            </Card>
        ))}
      </div>

       <div className="hidden md:block">
            <Card>
            <CardContent className="pt-6">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.length > 0 ? (
                        users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>
                            <Badge variant={user.role === 'admin' || user.role === 'super_admin' ? 'default' : 'secondary'}>
                                {user.role}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            <RoleSelector
                                userId={user.id}
                                currentRole={user.role}
                                currentUserProfile={currentUserProfile}
                                onRoleUpdate={fetchUsers}
                                />
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={3} className="text-center">
                            No users found.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
       </div>
    </>
  );
}
