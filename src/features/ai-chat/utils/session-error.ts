export function getSessionErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return '会话处理失败'
  }

  const dataMessage = (error as { data?: { message?: unknown } }).data?.message
  if (typeof dataMessage === 'string' && dataMessage.trim()) {
    return dataMessage
  }

  const message = (error as { message?: unknown }).message
  if (typeof message === 'string' && message.trim()) {
    return message
  }

  const name = (error as { name?: unknown }).name
  if (typeof name === 'string' && name.trim()) {
    return name
  }

  return '会话处理失败'
}
