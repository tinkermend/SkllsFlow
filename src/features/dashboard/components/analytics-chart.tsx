import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const data = [
  {
    name: '周一',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: '周二',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: '周三',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: '周四',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: '周五',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: '周六',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
  {
    name: '周日',
    clicks: Math.floor(Math.random() * 900) + 100,
    uniques: Math.floor(Math.random() * 700) + 80,
  },
]

export function AnalyticsChart() {
  return (
    <ResponsiveContainer width='100%' height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id='colorClicks' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#4285F4' stopOpacity={0.3} />
            <stop offset='95%' stopColor='#4285F4' stopOpacity={0} />
          </linearGradient>
          <linearGradient id='colorUniques' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#34A853' stopOpacity={0.3} />
            <stop offset='95%' stopColor='#34A853' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray='3 3'
          stroke='hsl(var(--border))'
          opacity={0.3}
        />
        <XAxis
          dataKey='name'
          stroke='hsl(var(--muted-foreground))'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='hsl(var(--muted-foreground))'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--popover-foreground))',
          }}
          cursor={{
            stroke: '#4285F4',
            strokeWidth: 1,
            strokeDasharray: '5 5',
          }}
        />
        <Area
          type='monotone'
          dataKey='clicks'
          stroke='#4285F4'
          strokeWidth={2}
          fill='url(#colorClicks)'
        />
        <Area
          type='monotone'
          dataKey='uniques'
          stroke='#34A853'
          strokeWidth={2}
          fill='url(#colorUniques)'
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
