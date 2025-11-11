import { forwardRef, InputHTMLAttributes, WheelEvent } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = '', type, onWheel, ...props },
  ref,
) {
  const wheelHandler =
    type === 'number'
      ? (event: WheelEvent<HTMLInputElement>) => {
          onWheel?.(event);
          if (!event.defaultPrevented) {
            event.currentTarget.blur();
            event.preventDefault();
          }
        }
      : onWheel;

  return (
    <input
      ref={ref}
      type={type}
      {...props}
      onWheel={wheelHandler}
      className={`theme-border rounded border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${className}`}
    />
  );
});

export default Input;
