import { forwardRef, InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, Props>(function Input({ className = '', ...props }, ref) {
  return (
    <input ref={ref} {...props} className={`rounded border theme-border px-3 py-2 bg-white focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 ${className}`} />
  )
})

export default Input


