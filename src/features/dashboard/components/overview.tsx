import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'

const data = [
  {
    name: '1月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '2月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '3月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '4月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '5月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '6月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '7月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '8月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '9月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '10月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '11月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
  {
    name: '12月',
    total: Math.floor(Math.random() * 5000) + 1000,
  },
]

// Google Material Design inspired colors - Using direct color values
const COLORS = [
  '#4285F4', // Google Blue
  '#EA4335', // Google Red
  '#FBBC04', // Google Yellow
  '#34A853', // Google Green
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
]

export function Overview() {
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='hsl(var(--muted-foreground))'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          direction='ltr'
          stroke='hsl(var(--muted-foreground))'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--popover-foreground))',
          }}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
        />
        <Bar dataKey='total' radius={[8, 8, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
