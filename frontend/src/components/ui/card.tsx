import * as React from "react";
import { cn } from "@/lib/utils";

type CardTone = 'default' | 'contrast' | 'danger';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;       // visual intent: default | high-contrast | error
  elevated?: boolean;    // stronger shadow/outline
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, tone = 'default', elevated = false, ...props }, ref) => {
    const toneClass =
      tone === 'danger'
        ? 'bg-red-600/10 text-foreground border border-red-500/50'
        : tone === 'contrast'
        ? 'bg-background text-foreground border-2 border-foreground/30'
        : 'glass-card';
    const elevationClass = elevated ? 'shadow-xl shadow-black/20 dark:shadow-white/10' : '';
    return (
      <div
        ref={ref}
        className={cn(toneClass, elevationClass, className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  divider?: boolean; // adds a bottom divider for clarity
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, divider = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-1.5 p-6",
        divider && "border-b border-border/60 pb-4",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
