import { ModelFileList } from '@/components/quote/wizard/ModelFileList'
import { ModelFileRow } from '@/components/quote/wizard/ModelFileRow'
import React from 'react'

type QuoteSummaryItem = {
  actions?: React.ReactNode
  attributes: Array<{ label: string; value: React.ReactNode }>
  extra?: React.ReactNode
  key: string
  meta?: React.ReactNode
  name: string
  size?: number
  variant?: 'default' | 'muted'
}

type QuoteSummaryCardProps = {
  description?: string
  items: QuoteSummaryItem[]
  notes?: React.ReactNode
  notesTitle?: string
  title: string
}

export const QuoteSummaryCard: React.FC<QuoteSummaryCardProps> = ({
  description,
  items,
  notes,
  notesTitle = 'Notes',
  title,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>

      <ModelFileList>
        {items.map((item) => (
          <ModelFileRow
            actions={item.actions}
            key={item.key}
            meta={item.meta}
            name={item.name}
            size={item.size}
            variant={item.variant}
          >
            <dl className="grid gap-2 text-xs md:grid-cols-4">
              {item.attributes.map((attribute) => (
                <div key={`${item.key}-${attribute.label}`}>
                  <dt className="text-muted-foreground">{attribute.label}</dt>
                  <dd className="font-medium">{attribute.value}</dd>
                </div>
              ))}
            </dl>
            {item.extra ? <div className="mt-2">{item.extra}</div> : null}
          </ModelFileRow>
        ))}
      </ModelFileList>

      {notes ? (
        <div>
          <h4 className="font-semibold">{notesTitle}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{notes}</p>
        </div>
      ) : null}
    </div>
  )
}

export type { QuoteSummaryItem }
