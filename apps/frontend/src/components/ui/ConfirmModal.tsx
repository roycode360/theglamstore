import React from 'react'

type Props = {
  open: boolean
  title?: string
  message?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

export default function ConfirmModal({ open, title = 'Are you sure?', message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onClose }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg border theme-border theme-card p-6 shadow-xl">
        <div className="text-lg font-semibold mb-2 text-brand">{title}</div>
        {message && <div className="text-sm mb-4" style={{ color: 'rgb(var(--muted))' }}>{message}</div>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 h-9 rounded-md btn-ghost text-sm">{cancelText}</button>
          <button onClick={async ()=> { await onConfirm(); onClose() }} className="px-3 h-9 rounded-md btn-primary text-sm">{confirmText}</button>
        </div>
      </div>
    </div>
  )
}


