import { useState, useCallback } from 'react'
import { Loader2, X, FileArchive, UploadCloud, Check, Tags, Settings, Sparkles, Box } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { useCreateSkill } from '../hooks/use-skills'
import { SkillStatus } from '../types'
import { SKILL_CATEGORIES } from '../config/skill-categories'
import { IconPicker } from './icon-picker'

interface CreateSkillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  skillId: string
  name: string
  description: string
  icon: string
  category: string
  tags: string[]
  status: SkillStatus
  sortOrder: number
  file: File | null
}

export function CreateSkillDialog({ open, onOpenChange }: CreateSkillDialogProps) {
  const createSkillMutation = useCreateSkill()
  const [formData, setFormData] = useState<FormData>({
    skillId: '',
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

  const validateSkillId = (skillId: string): string => {
    if (!skillId.trim()) {
      return '请先上传技能压缩包以生成技能ID'
    }
    if (skillId.includes(' ')) {
      return '技能ID不能包含空格'
    }
    if (!/^[a-zA-Z0-9_\-.]+$/.test(skillId)) {
      return '技能ID只能包含英文、数字、下划线、连字符和点号'
    }
    if (skillId.length > 64) {
      return '技能ID不能超过 64 个字符'
    }
    return ''
  }

  const deriveSkillIdFromZipName = (fileName: string): string =>
    fileName.replace(/\.zip$/i, '').trim()

  const validateAndSetFile = useCallback((file: File) => {
    // 验证文件类型
    if (!/\.zip$/i.test(file.name)) {
      setErrors((prev) => ({ ...prev, file: '只支持 .zip 格式的压缩包' }))
      return
    }

    // 验证文件大小 (限制 1MB)
    if (file.size > 1 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: '文件大小不能超过 1MB' }))
      return
    }

    const derivedSkillId = deriveSkillIdFromZipName(file.name)
    const skillIdError = validateSkillId(derivedSkillId)
    if (skillIdError) {
      setErrors((prev) => ({
        ...prev,
        file: '技能包文件名不符合技能ID规则，请重命名后重试',
        skillId: skillIdError,
      }))
      return
    }

    setFormData((prev) => ({ ...prev, file, skillId: derivedSkillId }))
    setErrors((prev) => ({ ...prev, file: '', skillId: '' }))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    validateAndSetFile(file)
  }

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null, skillId: '' }))
    setErrors((prev) => ({ ...prev, file: '', skillId: '' }))
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

    const skillIdError = validateSkillId(formData.skillId)
    if (skillIdError) {
      newErrors.skillId = skillIdError
    }

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
      // 直接创建技能（包含文件）
      await createSkillMutation.mutateAsync({
        skillId: formData.skillId,
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        category: formData.category,
        tags: formData.tags,
        status: formData.status,
        sortOrder: formData.sortOrder,
        file: formData.file!,
      })

      // 重置表单
      setFormData({
        skillId: '',
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
  }, [validateAndSetFile])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="bg-muted/10 px-8 py-6 border-b shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight">新建技能</DialogTitle>
              <DialogDescription className="text-sm">
                填写基本信息并上传技能包，配置您的专属技能环境
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar-thin scrollbar-thumb-muted-foreground/20">
          {/* Section 1: Identity */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Box className="w-3.5 h-3.5" /> 基本信息
            </div>
            <div className="flex gap-6 items-start">
              <div className="shrink-0 pt-1">
                <IconPicker
                  value={formData.icon}
                  onChange={(icon) =>
                    setFormData((prev) => ({ ...prev, icon }))
                  }
                  size="square"
                  className="w-[100px] h-[100px] !text-5xl shadow-sm border-2 border-dashed border-muted-foreground/20 hover:border-primary hover:bg-primary/5 transition-all rounded-xl"
                />
              </div>
              <div className="flex-1 grid gap-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skillId" className="text-xs font-medium text-muted-foreground">
                      技能ID（自动生成）
                    </Label>
                    <Input
                      id="skillId"
                      placeholder="上传 .zip 后自动生成"
                      value={formData.skillId}
                      disabled
                      className={`h-10 bg-muted text-muted-foreground cursor-not-allowed ${errors.skillId ? 'border-destructive' : ''}`}
                    />
                    {errors.skillId && (
                      <p className="text-xs text-destructive">{errors.skillId}</p>
                    )}
                    {!errors.skillId && (
                      <p className="text-xs text-muted-foreground">技能包文件名自动生成</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                      技能名称 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="技能名字"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className={`h-10 ${errors.name ? 'border-destructive' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs font-medium text-muted-foreground">
                      技能分类 <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger
                        className={`h-10 ${errors.category ? 'border-destructive' : ''}`}
                      >
                        <SelectValue placeholder="选择所属分类" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILL_CATEGORIES.map((cat) => (
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

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">
                    技能描述 <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="描述技能的功能和用途..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={2}
                    className={`resize-none min-h-[60px] ${errors.description ? 'border-destructive' : ''}`}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Section 2: Configuration */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Tags className="w-3.5 h-3.5" /> 标签与配置
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">技能标签</Label>
              <div className="p-3 rounded-xl border bg-card/50 shadow-sm space-y-3 transition-colors focus-within:ring-1 focus-within:ring-ring">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-2.5 py-1 gap-1.5 text-xs hover:bg-secondary/80 transition-colors pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveTag(tag)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <input
                    className="flex-1 bg-transparent border-none outline-none text-sm min-w-[120px] placeholder:text-muted-foreground/50 h-7"
                    placeholder={formData.tags.length > 0 ? "继续添加..." : "输入标签后按回车添加"}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                  />
                </div>
              </div>
              {errors.tags && (
                <p className="text-xs text-destructive">{errors.tags}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="text-xs font-medium text-muted-foreground">排序权重</Label>
                <div className="relative">
                  <Input
                    id="sortOrder"
                    type="number"
                    placeholder="0"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="h-10 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/60" />

          {/* Section 3: File */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <Settings className="w-3.5 h-3.5" /> 资源文件
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                技能包 (.zip) <span className="text-destructive">*</span>
              </Label>
              {!formData.file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file')?.click()}
                  className={`
                    group relative cursor-pointer
                    border-2 border-dashed rounded-xl p-8
                    flex flex-col items-center justify-center gap-4
                    transition-all duration-300 ease-out
                    ${isDragging
                      ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner'
                      : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
                    }
                    ${errors.file ? 'border-destructive/50 bg-destructive/5' : ''}
                  `}
                >
                  <input
                    id="file"
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-4 rounded-full bg-primary/5 text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      点击或拖拽 .zip 文件至此处上传
                    </p>
                    <p className="text-xs text-muted-foreground">
                      支持标准技能压缩包格式，大小不超过 1MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl border bg-muted/20 p-4 flex items-center gap-4 group hover:bg-muted/30 transition-colors">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileArchive className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                         <p className="text-sm font-medium truncate">{formData.file.name}</p>
                         <Check className="w-3.5 h-3.5 text-green-500" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {errors.file && (
                <p className="text-xs text-destructive animate-in slide-in-from-left-1">{errors.file}</p>
              )}
            </div>
          </div>

          {/* Global Errors */}
          {errors.submit && (
            <div className="rounded-lg bg-destructive/10 p-4 flex items-center gap-3 text-sm text-destructive border border-destructive/20 animate-in slide-in-from-bottom-2">
              <X className="h-4 w-4 shrink-0" />
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t bg-muted/10 shrink-0 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-6 rounded-lg border-muted-foreground/20 hover:bg-muted"
            onClick={() => onOpenChange(false)}
            disabled={createSkillMutation.isPending}
          >
            取消
          </Button>
          <Button
            type="button"
            className="h-10 px-8 rounded-lg shadow-lg hover:shadow-primary/25 transition-all text-sm font-medium"
            onClick={handleSubmit}
            disabled={createSkillMutation.isPending}
          >
            {createSkillMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            立即创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
