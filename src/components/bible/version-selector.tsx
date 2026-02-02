'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Book } from 'lucide-react'
import { cn } from '@/lib/utils'

export const BIBLE_VERSIONS = [
  { id: 'nvi', name: 'NVI', fullName: 'Nova Versão Internacional' },
  { id: 'acf', name: 'ACF', fullName: 'Almeida Corrigida Fiel' },
  { id: 'ra', name: 'RA', fullName: 'Revista e Atualizada' },
  { id: 'kjv', name: 'KJV', fullName: 'King James Version' },
  { id: 'bbe', name: 'BBE', fullName: 'Bible in Basic English' },
  { id: 'apee', name: 'APEE', fullName: 'Português Europeu' },
] as const

export type BibleVersionId = typeof BIBLE_VERSIONS[number]['id']

interface VersionSelectorProps {
  selectedVersion: string
  onSelectVersion: (version: string) => void
  className?: string
  showFullName?: boolean
}

export function VersionSelector({
  selectedVersion,
  onSelectVersion,
  className,
  showFullName = false,
}: VersionSelectorProps) {
  const currentVersion = BIBLE_VERSIONS.find(v => v.id === selectedVersion) || BIBLE_VERSIONS[0]

  return (
    <Select value={selectedVersion} onValueChange={onSelectVersion}>
      <SelectTrigger className={cn("w-full sm:w-[140px]", className)}>
        <div className="flex items-center gap-2">
          <Book className="h-4 w-4 text-muted-foreground" />
          <SelectValue>
            {showFullName ? currentVersion.fullName : currentVersion.name}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {BIBLE_VERSIONS.map((version) => (
          <SelectItem key={version.id} value={version.id}>
            <div className="flex flex-col">
              <span className="font-medium">{version.name}</span>
              <span className="text-xs text-muted-foreground">{version.fullName}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function getVersionName(versionId: string): string {
  const version = BIBLE_VERSIONS.find(v => v.id === versionId)
  return version?.name || 'NVI'
}

export function getVersionFullName(versionId: string): string {
  const version = BIBLE_VERSIONS.find(v => v.id === versionId)
  return version?.fullName || 'Nova Versão Internacional'
}
