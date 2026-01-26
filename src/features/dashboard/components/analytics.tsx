import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AnalyticsChart } from './analytics-chart'

export function Analytics() {
  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>流量概览</CardTitle>
          <CardDescription>每周点击量和独立访客数</CardDescription>
        </CardHeader>
        <CardContent className='px-6'>
          <AnalyticsChart />
        </CardContent>
      </Card>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>总点击量</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M3 3v18h18' />
              <path d='M7 15l4-4 4 4 4-6' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>1,248</div>
            <p className='text-xs text-muted-foreground'>较上周 +12.4%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>独立访客</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <circle cx='12' cy='7' r='4' />
              <path d='M6 21v-2a6 6 0 0 1 12 0v2' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>832</div>
            <p className='text-xs text-muted-foreground'>较上周 +5.8%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>跳出率</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M3 12h6l3 6 3-6h6' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>42%</div>
            <p className='text-xs text-muted-foreground'>较上周 -3.2%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>平均会话时长</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <circle cx='12' cy='12' r='10' />
              <path d='M12 6v6l4 2' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>3分24秒</div>
            <p className='text-xs text-muted-foreground'>较上周 +18秒</p>
          </CardContent>
        </Card>
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <Card className='col-span-1 lg:col-span-4'>
          <CardHeader>
            <CardTitle>流量来源</CardTitle>
            <CardDescription>主要流量来源渠道</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: '直接访问', value: 512, color: '#4285F4' },
                {
                  name: 'Product Hunt',
                  value: 238,
                  color: '#EA4335',
                },
                { name: 'Twitter', value: 174, color: '#34A853' },
                { name: '博客', value: 104, color: '#FBBC04' },
              ]}
              valueFormatter={(n) => `${n}`}
            />
          </CardContent>
        </Card>
        <Card className='col-span-1 lg:col-span-3'>
          <CardHeader>
            <CardTitle>设备类型</CardTitle>
            <CardDescription>用户访问设备分布</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: '桌面端', value: 74, color: '#9C27B0' },
                { name: '移动端', value: 22, color: '#00BCD4' },
                { name: '平板', value: 4, color: '#FBBC04' },
              ]}
              valueFormatter={(n) => `${n}%`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SimpleBarList({
  items,
  valueFormatter,
}: {
  items: { name: string; value: number; color: string }[]
  valueFormatter: (n: number) => string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className='space-y-3'>
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`
        return (
          <li key={i.name} className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='mb-1 truncate text-xs font-medium'>{i.name}</div>
              <div className='h-2.5 w-full rounded-full bg-muted'>
                <div
                  className='h-2.5 rounded-full transition-all duration-500 ease-out'
                  style={{ width, backgroundColor: i.color }}
                />
              </div>
            </div>
            <div className='ps-2 text-sm font-semibold tabular-nums'>
              {valueFormatter(i.value)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
