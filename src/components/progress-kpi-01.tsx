'use client'

import { AnimatedNumber } from '@/components/animated-number'
import { ValueFormatter } from '@/components/dashboardblocks/chart'
import { KPI, KPIContent, KPIValue } from '@/components/kpi'
import { ProgressBar } from '@/components/progress-bar'
import { Trend } from '@/components/trend'

import { CardDescription } from '@/components/ui/card'

interface ProgressKPI1Props {
  trend: number
  percentage: number
  title: string
  value: number
  formatter?: ValueFormatter
  target?: number
}

const exampleProps: ProgressKPI1Props = {
  trend: 7.5,
  percentage: 55,
  title: 'Revenue',
  value: 87500,
  formatter: (value) => `$${value.toLocaleString()}`,
}

const ProgressKPI1 = (props: ProgressKPI1Props) => {
  const { trend, percentage, title, value, formatter, target } = props
  return (
    <KPI>
      <KPIContent className='space-y-1'>
        <div className='flex items-center justify-between'>
          <CardDescription>{title}</CardDescription>
          <Trend trend={trend} variant='badge' />
        </div>
        <KPIValue value={value} formatter={formatter} animated />
        <div className='mt-4 space-y-1 text-sm text-muted-foreground'>
          <div className='flex items-center justify-between'>
            <span>
              <span className='font-semibold text-foreground'>
                <AnimatedNumber
                  value={percentage}
                  formatter={(value) => `${value.toLocaleString()}%`}
                />
              </span>{' '}
              of monthly target
            </span>
            <span className='font-semibold text-foreground'>
              {target ? (formatter ? formatter(target) : target) : '$100k'}
            </span>
          </div>
          <ProgressBar percentage={percentage} />
        </div>
      </KPIContent>
    </KPI>
  )
}

export { ProgressKPI1, exampleProps as progressKpi1ExampleProps, type ProgressKPI1Props }
