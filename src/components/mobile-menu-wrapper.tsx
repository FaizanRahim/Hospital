
'use client';

import { useSidebar, SidebarTrigger } from './ui/sidebar';
import { useEffect, useState } from 'react';

// This component is no longer used, but kept for potential future use.
// It was creating a duplicate hamburger menu.
export function MobileMenu() {
    const { isMobile } = useSidebar();
    const [ isMounted, setIsMounted ] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (isMobile && isMounted) {
        return <SidebarTrigger />;
    }

    return null;
}
