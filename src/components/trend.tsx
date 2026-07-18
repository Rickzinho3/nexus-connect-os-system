import { AnimatedNumber } from '@/components/animated-number'
import { type VariantProps, cva } from 'class-variance-authority'
import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'

type TrendDirection = 'up' | 'down' | 'neutral'

const trendVariants = cva('', {
  variants: {
    variant: {
      default: 'flex items-center text-sm font-medium',
      'icon-only': 'h-4 w-4',
      badge:
        'flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
    },
    direction: {
      up: '',
      down: '',
      neutral: '',
    },
  },
  compoundVariants: [
    {
      variant: 'default',
      direction: 'up',
      class: 'text-slate-900',
    },
    {
      variant: 'default',
      direction: 'down',
      class: 'text-slate-500',
    },
    {
      variant: 'default',
      direction: 'neutral',
      class: 'text-slate-400',
    },
    {
      variant: 'icon-only',
      direction: 'up',
      class: 'text-slate-900',
    },
    {
      variant: 'icon-only',
      direction: 'down',
      class: 'text-slate-500',
    },
    {
      variant: 'icon-only',
      direction: 'neutral',
      class: 'text-slate-400',
    },
    {
      variant: 'badge',
      direction: 'up',
      class: 'bg-slate-100 text-slate-900 border-slate-300',
    },
    {
      variant: 'badge',
      direction: 'down',
      class: 'bg-white text-slate-500 border-slate-200',
    },
    {
      variant: 'badge',
      direction: 'neutral',
      class: 'bg-slate-50 text-slate-400 border-slate-100',
    },
  ],
  defaultVariants: {
    variant: 'default',
    direction: 'neutral',
  },
})

interface TrendProps extends Omit<VariantProps<typeof trendVariants>, 'direction'> {
  animated?: boolean
  className?: string
  formatter?: (value: number) => string
  trend: number
  trendIcon?: 'arrow' | 'trend'
}

const defaultFormatter = (value: number): string => {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toLocaleString()}%`
}

function getTrendDirection(value: number): TrendDirection {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'neutral'
}

function Trend({
  animated = false,
  className,
  formatter = defaultFormatter,
  trend,
  trendIcon = 'trend',
  variant = 'default',
}: TrendProps) {
  const direction = getTrendDirection(trend)
  const TrendIcon =
    direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus
  const ArrowIcon =
    direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus
  const Icon = trendIcon === 'arrow' ? ArrowIcon : TrendIcon

  const displayValue = animated ? (
    <AnimatedNumber value={trend} formatter={formatter} />
  ) : (
    formatter(trend)
  )

  if (variant === 'icon-only') {
    return <Icon className={cn(trendVariants({ variant, direction }), className)} />
  }

  if (variant === 'badge') {
    return (
      <div className={cn(trendVariants({ variant, direction }), className)}>
        <Icon className='h-4 w-4' />
        {displayValue}
      </div>
    )
  }

  return (
    <div className={cn(trendVariants({ variant, direction }), className)}>
      <Icon className='mr-1 h-4 w-4' />
      {displayValue}
    </div>
  )
}

export { Trend, trendVariants, getTrendDirection }
export type { TrendProps, TrendDirection }
