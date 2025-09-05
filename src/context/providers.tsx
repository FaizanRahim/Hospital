
'use client';

import { UserProfileProvider } from '../context/user-profile-context';
import { SidebarProvider } from '../components/ui/sidebar';
import { ClientSideAuth } from '../components/client-side-auth';


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProfileProvider>
      <SidebarProvider>
        <ClientSideAuth>
          {children}
        </ClientSideAuth>
      </SidebarProvider>
    </UserProfileProvider>
  );
}
