import React from 'react'

type ModelFileListProps = {
  children: React.ReactNode
  className?: string
}

export const ModelFileList: React.FC<ModelFileListProps> = ({ children, className }) => {
  return <ul className={['space-y-3', className].filter(Boolean).join(' ')}>{children}</ul>
}
