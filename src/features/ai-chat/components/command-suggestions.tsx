import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FEATURE_FLAGS } from '../config/feature-flags'
import { useCommands } from '../hooks/use-commands'
import type { Command } from '../types'

interface CommandSuggestionsProps {
  inputValue: string
  onSelect: (command: Command) => void
  className?: string
}

export function CommandSuggestions({
  inputValue,
  onSelect,
  className,
}: CommandSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { data: commands = [] } = useCommands()
  const listRef = useRef<HTMLDivElement>(null)

  // 只在输入 / 开头时显示
  const shouldShow =
    FEATURE_FLAGS.enableCommandMenu &&
    inputValue.startsWith('/') &&
    inputValue.length > 0

  // 过滤命令
  const query = inputValue.slice(1).toLowerCase()
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query)
  )

  // 重置选中索引
  useEffect(() => {
    // Keyboard selection is derived from the query string; resetting it here
    // keeps the current imperative keydown listener simple.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(0)
  }, [inputValue])

  // 滚动到选中项
  useEffect(() => {
    if (listRef.current) {
      const selectedItem = listRef.current.children[
        selectedIndex
      ] as HTMLElement
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!shouldShow || filteredCommands.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
        case 'Tab':
          e.preventDefault()
          onSelect(filteredCommands[selectedIndex])
          break
        case 'Escape':
          e.preventDefault()
          // 清除输入
          break
      }
    },
    [shouldShow, filteredCommands, selectedIndex, onSelect]
  )

  useEffect(() => {
    if (shouldShow) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shouldShow, handleKeyDown])

  if (!shouldShow || filteredCommands.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        // 使用 w-full 使窗口宽度与输入框容器一致，移除了 max-w-md 限制
        'absolute bottom-full left-0 mb-2 w-full rounded-lg border bg-popover p-1 shadow-lg',
        className
      )}
    >
      <div ref={listRef} className='max-h-64 overflow-y-auto'>
        {filteredCommands.map((command, index) => (
          <button
            key={command.name}
            type='button'
            className={cn(
              'flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-muted'
            )}
            onClick={() => onSelect(command)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className='font-mono text-primary'>/{command.name}</span>
            {/* 限制 description 显示长度，超过 80 个字符时截断并添加省略号 */}
            <span className='text-muted-foreground'>
              {command.description.length > 80
                ? `${command.description.slice(0, 80)}...`
                : command.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
