'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

interface SuggestedVersesProps {
  verses: Array<{
    reference: string
    text: string
  }>
}

export function SuggestedVerses({ verses }: SuggestedVersesProps) {
  if (!verses || verses.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <BookOpen className="w-4 h-4" />
        Versiculos Sugeridos
      </h3>

      <div className="space-y-2">
        {verses.map((verse, index) => (
          <Card
            key={index}
            className="border-primary/20 bg-primary/5"
          >
            <CardContent className="p-4">
              <p className="text-sm text-foreground italic mb-2">
                &ldquo;{verse.text}&rdquo;
              </p>
              <p className="text-xs font-bold text-primary">
                {verse.reference}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
