
'use client';

import { useSidebar, SidebarTrigger } from './ui/sidebar';
import { useEffect, useState } from 'react';


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
