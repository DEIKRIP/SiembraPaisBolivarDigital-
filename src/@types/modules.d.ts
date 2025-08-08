// Declaraciones de tipos para módulos que no tienen tipos definidos
declare module '@/hooks/use-toast' {
  export function useToast(): {
    toasts: Array<{
      id: string;
      title: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }>;
    toast: (props: {
      title: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }) => void;
    dismiss: (toastId?: string) => void;
  };
}

declare module '@/components/ui/Button' {
  import * as React from 'react';
  
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  }
  
  export const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
}

declare module '@/components/ui/Dialog' {
  import * as React from 'react';
  
  export const Dialog: React.FC<React.PropsWithChildren>;
  export const Content: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const Header: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const Title: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  export const Description: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
  export const Footer: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const Close: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/Input' {
  import * as React from 'react';
  
  export const Input: React.ForwardRefExoticComponent<
    React.InputHTMLAttributes<HTMLInputElement> & {
      className?: string;
    } & React.RefAttributes<HTMLInputElement>
  >;
}

declare module '@/components/ui/Label' {
  import * as React from 'react';
  
  export const Label: React.ForwardRefExoticComponent<
    React.LabelHTMLAttributes<HTMLLabelElement> & {
      className?: string;
    } & React.RefAttributes<HTMLLabelElement>
  >;
}

declare module '@/components/ui/Textarea' {
  import * as React from 'react';
  
  export const Textarea: React.ForwardRefExoticComponent<
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
      className?: string;
    } & React.RefAttributes<HTMLTextAreaElement>
  >;
}

declare module '@/lib/bolivarDigitalActions' {
  export interface Client {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    created_at?: string;
    updated_at?: string;
  }
  
  export function saveClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Client>;
  export function getClients(): Promise<Client[]>;
  export function deleteClient(id: string): Promise<void>;
}
