
'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
  ButtonHTMLAttributes,
  Suspense,
  useEffect,
  Children,
  isValidElement,
} from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarLogic } from './sidebar-logic';
import { Slot } from '@radix-ui/react-slot';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { ChevronLeft } from 'lucide-react';
import { Button } from './button';


interface SidebarContextProps {
  isOpen: boolean;
  isMobile: boolean;
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [isOpen, setOpen] = useState(!isMobile);

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMobile]);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ isOpen, isMobile, setOpen, toggle }),
    [isOpen, isMobile, setOpen, toggle]
  );

  return (
    <SidebarContext.Provider value={value}>
       <Suspense fallback={null}>
         <SidebarLogic />
       </Suspense>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useSidebarContext();
}

const sidebarVariants = cva(
    "bg-sidebar text-sidebar-foreground border-r transition-all duration-300 ease-in-out",
    {
        variants: {
            state: {
                open: "w-64",
                closed: "w-16",
            },
        },
        defaultVariants: {
            state: "open",
        },
    }
);

export function Sidebar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isOpen, isMobile, setOpen } = useSidebarContext();

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={cn(
                    'fixed top-0 left-0 h-full w-64 bg-sidebar border-r z-50 flex flex-col',
                    className
                )}
            >
                {children}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <aside
      className={cn(
        sidebarVariants({ state: isOpen ? 'open' : 'closed' }),
        'hidden md:flex flex-col',
        className
      )}
    >
      {children}
    </aside>
  );
}

const sidebarMenuButtonVariants = cva(
    "flex items-center w-full text-left p-3 text-sm font-medium rounded-md transition-colors duration-200",
    {
        variants: {
            isActive: {
                true: "bg-sidebar-primary text-sidebar-primary-foreground",
                false: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }
        },
        defaultVariants: {
            isActive: false,
        }
    }
);

interface SidebarMenuButtonProps extends Omit<ButtonHTMLAttributes<HTMLDivElement>, 'children'>, VariantProps<typeof sidebarMenuButtonVariants> {
    icon: ReactNode;
    label: string;
}

export function SidebarMenuButton({ className, isActive, icon, label, ...props }: SidebarMenuButtonProps) {
    const { isOpen } = useSidebarContext();

    const buttonContent = (
      <div className={cn(
          sidebarMenuButtonVariants({ isActive }),
          "flex items-center gap-3",
          !isOpen && "justify-center",
          className
      )}
      {...props}
      >
        {icon}
        {isOpen && (
          <span className="whitespace-nowrap overflow-hidden">
            {label}
          </span>
        )}
      </div>
    );

    if (isOpen) {
        return buttonContent;
    }

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export function SidebarMenu({ children, className }: { children: ReactNode, className?: string }) {
    return <ul className={cn("space-y-1 p-2", className)}>{children}</ul>;
}

export function SidebarMenuItem({ children }: { children: ReactNode }) {
    return <li>{children}</li>;
}

export function SidebarTrigger({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    const { toggle } = useSidebarContext();
    return (
        <button onClick={toggle} className={cn("p-2 rounded-md hover:bg-muted md:hidden", className)} {...props}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
    );
}

export function SidebarToggle({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isOpen, toggle, isMobile } = useSidebar();
  if (isMobile) return null;

  return (
    <div className={cn("hidden md:flex p-2", isOpen ? "justify-end" : "justify-center")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn("transition-transform duration-300 ease-in-out", className)}
          {...props}
        >
          <ChevronLeft className={cn("transition-transform", !isOpen && "rotate-180")} />
        </Button>
    </div>
  )
}
