import { formatFileSize } from '@/lib/quotes/utils'
import { cn } from '@/utilities/cn'
import React from 'react'

type ModelFileRowProps = {
  actions?: React.ReactNode
  children?: React.ReactNode
  name: string
  size?: number
  subtitle?: React.ReactNode
  variant?: 'muted' | 'default'
}

export const ModelFileRow: React.FC<ModelFileRowProps> = ({
  actions,
  children,
  name,
  size,
  subtitle,
  variant = 'default',
}) => {
  return (
    <li
      className={cn('space-y-3 rounded-lg border px-4 py-3 text-sm', {
        'bg-muted/20 shadow-sm': variant === 'default',
        'bg-muted/30': variant === 'muted',
      })}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col">
          <span className="font-medium">{name}</span>
          {subtitle ? <span className="text-xs text-muted-foreground">{subtitle}</span> : null}
        </div>
        <div className="flex items-center gap-3 md:text-right">
          {typeof size === 'number' ? (
            <span className="text-xs text-muted-foreground">{formatFileSize(size)}</span>
          ) : null}
          {actions}
        </div>
      </div>

      {children ? <div>{children}</div> : null}
    </li>
  )
}
