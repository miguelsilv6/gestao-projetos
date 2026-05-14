'use client'

import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { slugToNuipc, nuipcToSlug } from '@/lib/utils'

const schema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória'),
  dataRealizacao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function AddAtividadePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.nuipc as string
  const nuipc = slugToNuipc(slug)
  const [inqueritoid, setInqueritoid] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/inqueritos/${slug}`)
      .then((r) => r.json())
      .then((d) => setInqueritoid(d.id))
      .catch(() => toast.error('Erro ao carregar inquérito'))
  }, [slug])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    if (!inqueritoid) return

    const res = await fetch('/api/atividades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, inqueritoid }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'Erro ao guardar atividade')
      return
    }

    toast.success('Atividade registada')
    router.push(`/inqueritos/${nuipcToSlug(nuipc)}`)
    router.refresh()
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center gap-2">
        <Link
          href={`/inqueritos/${nuipcToSlug(nuipc)}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {nuipc}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nova Atividade</h1>
        <p className="text-muted-foreground text-sm font-mono">{nuipc}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registo de atividade</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dataRealizacao">Data de realização</Label>
              <Input
                id="dataRealizacao"
                type="datetime-local"
                {...register('dataRealizacao')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva a atividade realizada..."
                rows={6}
                {...register('descricao')}
              />
              {errors.descricao && (
                <p className="text-xs text-red-600">{errors.descricao.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting || !inqueritoid}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registar
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
