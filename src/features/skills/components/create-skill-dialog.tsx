import { useState, useCallback } from 'react'
import { Loader2, Upload, X, FileArchive, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useCreateSkill, useUploadSkillFile } from '../hooks/use-skills'
import { SkillStatus } from '../types'
import { IconPicker } from './icon-picker'

interface CreateSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  name: string
  description: string
  icon: string
  category: string
  tags: string[]
  status: SkillStatus
  sortOrder: number
  file: File | null
}

const CATEGORIES = [
  { value: 'database', label: '数据库' },
  { value: 'cache', label: '缓存' },
  { value: 'devops', label: 'DevOps' },
  { value: 'testing', label: '测试' },
  { value: 'monitoring', label: '监控' },
  { value: 'security', label: '安全' },
  { value: 'other', label: '其他' },
]

export function CreateSkillDialog({ open, onOpenChange }: CreateSkillDialogProps) {
  const createSkillMutation = useCreateSkill()
  const uploadFileMutation = useUploadSkillFile()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    icon: '🔧',
    category: '',
    tags: [],
    status: SkillStatus.ACTIVE,
    sortOrder: 0,
    file: null,
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDragging, setIsDragging] = useState(false)

  const validateAndSetFile = (file: File) => {
    // 验证文件类型
    if (!file.name.endsWith('.zip')) {
      setErrors((prev) => ({ ...prev, file: '只支持 .zip 格式的压缩包' }))
      return
    }

    // 验证文件大小 (限制 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: '文件大小不能超过 50MB' }))
      return
    }

    setFormData((prev) => ({ ...prev, file }))
    setErrors((prev) => ({ ...prev, file: '' }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    validateAndSetFile(file)
  }

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null }))
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (!trimmedTag) return
    if (formData.tags.includes(trimmedTag)) {
      setErrors((prev) => ({ ...prev, tags: '标签已存在' }))
      return
    }
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmedTag] }))
    setTagInput('')
    setErrors((prev) => ({ ...prev, tags: '' }))
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入技能名称'
    } else if (formData.name.length > 120) {
      newErrors.name = '技能名称不能超过 120 个字符'
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入技能描述'
    }

    if (!formData.category) {
      newErrors.category = '请选择技能分类'
    }

    if (!formData.file) {
      newErrors.file = '请上传技能压缩包'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // 先上传文件获取路径
      const { filePath } = await uploadFileMutation.mutateAsync(formData.file!)

      // 创建技能记录
      await createSkillMutation.mutateAsync({
        skillId: `skill_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        iconPath: formData.icon,
        category: formData.category,
        tags: formData.tags,
        status: formData.status,
        sortOrder: formData.sortOrder,
        filePath,
        createdBy: 1, // TODO: 从认证状态获取当前用户 ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // 重置表单
      setFormData({
        name: '',
        description: '',
        icon: '🔧',
        category: '',
        tags: [],
        status: SkillStatus.ACTIVE,
        sortOrder: 0,
        file: null,
      })
      setTagInput('')
      setErrors({})
      onOpenChange(false)
    } catch (error) {
      console.error('创建技能失败:', error)
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : '创建失败',
      }))
    }
  }

  // 处理拖拽事件
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>新建技能</DialogTitle>
          <DialogDescription>
            填写基本信息并上传技能包，完成后点击"创建"按钮
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4 space-y-6 max-h-[calc(90vh-180px)]">
          {/* 第一组：核心识别 */}
          <div className="grid grid-cols-[80px_1fr] gap-4">
            {/* 技能图标 */}
            <div className="space-y-2">
              <Label className="text-xs">图标</Label>
              <IconPicker
                value={formData.icon}
                onChange={(icon) =>
                  setFormData((prev) => ({ ...prev, icon }))
                }
                size="square"
              />
            </div>

            {/* 右侧：名称 + 分类 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 技能名称 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs">
                  技能名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="请输入技能名称"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* 技能分类 */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs">
                  技能分类 <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger
                    className={errors.category ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="请选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category}</p>
                )}
              </div>
            </div>
          </div>

          {/* 第二组：内容描述 */}
          <div className="space-y-3">
            {/* 技能描述 */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs">
                技能描述 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="请输入技能描述"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
                className={`resize-none ${errors.description ? 'border-destructive' : ''}`}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            {/* 技能标签 */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-xs">技能标签</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="输入后回车添加标签"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="flex-1"
                />
              </div>
              {errors.tags && (
                <p className="text-xs text-destructive">{errors.tags}</p>
              )}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 第三组：系统属性 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 排序值 */}
            <div className="space-y-2">
              <Label htmlFor="sortOrder" className="text-xs">排序值</Label>
              <Input
                id="sortOrder"
                type="number"
                placeholder="数字越小越靠前"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            {/* 状态 - 改为 Switch */}
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <Label htmlFor="status" className="text-xs font-medium">技能状态</Label>
                <p className="text-xs text-muted-foreground">
                  {formData.status === SkillStatus.ACTIVE ? '启用后技能可见' : '禁用后技能不可见'}
                </p>
              </div>
              <Switch
                id="status"
                checked={formData.status === SkillStatus.ACTIVE}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: checked ? SkillStatus.ACTIVE : SkillStatus.DISABLED,
                  }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* 第四组：资源上传 */}
          <div className="space-y-3">
            <Label className="text-xs">
              技能压缩包 <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              {!formData.file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file')?.click()}
                  className={`
                    relative cursor-pointer border-2 border-dashed rounded-lg p-6
                    transition-colors duration-200
                    flex items-center gap-4
                    ${isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/30 hover:bg-muted/50'
                    }
                    ${errors.file ? 'border-destructive' : ''}
                  `}
                >
                  <input
                    id="file"
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-3 rounded-full bg-background shadow-sm">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-sm font-medium">
                      点击或拖拽 .zip 文件至此处上传
                    </p>
                    <p className="text-xs text-muted-foreground">
                      仅支持标准技能压缩包格式，大小不超过 50MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <FileArchive className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formData.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {errors.file && (
                <p className="text-xs text-destructive">{errors.file}</p>
              )}
            </div>
          </div>

          {/* 提交错误 */}
          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* 底部固定动作条 */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createSkillMutation.isPending || uploadFileMutation.isPending}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={createSkillMutation.isPending || uploadFileMutation.isPending}
          >
            {(createSkillMutation.isPending || uploadFileMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            创建技能
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
