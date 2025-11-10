import { QuoteStatus as StatusOptions } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  status: StatusOptions
  className?: string
}

export const QuoteStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn(
        'text-xs tracking-[0.1em] font-mono uppercase py-0 px-2 rounded w-fit',
        className,
        {
          'bg-primary/10': status === 'reviewing',
          'bg-success': status === 'approved',
          'bg-destructive/10 text-destructive': status === 'rejected',
        },
      )}
    >
      {status}
    </div>
  )
}
