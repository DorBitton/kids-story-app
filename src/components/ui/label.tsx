"use client"

import * as React from "react"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

function Label({ children, className = "", ...props }: LabelProps) {
  return (
    <label
      className={`text-sm font-medium leading-none ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}

export { Label }