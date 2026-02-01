import { Construction } from 'lucide-react'

export function UnderDevelopment() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <Construction size={72} />
        <h1 className='text-4xl leading-tight font-bold'>该功能正在开发中，敬请期待！</h1>
        <p className='text-center text-muted-foreground'>
          我们正在努力完善此功能。
          <br />
          请继续关注！
        </p>
      </div>
    </div>
  )
}
