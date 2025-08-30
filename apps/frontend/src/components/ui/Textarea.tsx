import { forwardRef, TextareaHTMLAttributes } from 'react'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea({ className = '', ...props }, ref) {
  return (
    <textarea ref={ref} {...props} className={`rounded border theme-border px-3 py-2 bg-white focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 ${className}`} />
  )
})

export default Textarea


