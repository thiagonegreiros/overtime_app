'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function ToastIcon({ variant }: { variant?: 'default' | 'destructive' | 'warning' }) {
  const config = {
    default: {
      icon: CheckCircle2,
      className: 'bg-green-600/90 text-green-200',
    },
    destructive: {
      icon: XCircle,
      className: 'bg-red-600/90 text-red-200',
    },
    warning: {
      icon: AlertCircle,
      className: 'bg-amber-500/90 text-amber-200',
    },
  };
  const { icon: Icon, className } = config[variant ?? 'default'] ?? config.default;
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <ToastIcon variant={variant} />
            <div className="grid gap-1 flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
