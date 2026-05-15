'use client'

import { useParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { slugToNuipc, nuipcToSlug } from '@/lib/utils'

interface AtividadePadrao {
  id: string
  nome: string
  descricao: string | null
  ativa: boolean
}

const schema = z.object({
  descricao: z.string().min(1, 'Selecione uma atividade'),
  observacoes: z.string().max(2000).optional(),
  dataRealizacao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function AddAtividadePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.nuipc as string
  const nuipc = slugToNuipc(slug)
  const [inqueritoid, setInqueritoid] = useState<string | null>(null)
  const [atividadesPadrao, setAtividadesPadrao] = useState<AtividadePadrao[]>([])
  const [loadingPadrao, setLoadingPadrao] = useState(true)

  useEffect(() => {
    fetch(`/api/inqueritos/${slug}`)
      .then((r) => r.json())
      .then((d) => setInqueritoid(d.id))
      .catch(() => toast.error('Erro ao carregar inquérito'))

    fetch('/api/atividades-padrao')
      .then((r) => r.json())
      .then((d: AtividadePadrao[]) => setAtividadesPadrao(d.filter((a) => a.ativa)))
      .catch(() => {})
      .finally(() => setLoadingPadrao(false))
  }, [slug])

  const defaultDatetime = new Date().toISOString().slice(0, 16)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { dataRealizacao: defaultDatetime },
  })

  const selectedNome = watch('descricao')
  const selectedPadrao = atividadesPadrao.find((a) => a.nome === selectedNome)

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

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="dataRealizacao">Data de realização</Label>
              <Input
                id="dataRealizacao"
                type="datetime-local"
                {...register('dataRealizacao')}
              />
            </div>

            {/* Activity type dropdown */}
            <div className="space-y-1.5">
              <Label>
                Tipo de atividade <span className="text-red-500">*</span>
              </Label>

              {loadingPadrao ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A carregar...
                </div>
              ) : atividadesPadrao.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground flex items-start gap-2">
                  <Settings className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Nenhuma atividade padrão configurada.{' '}
                    <Link
                      href="/configuracoes"
                      className="text-foreground underline underline-offset-2 hover:no-underline"
                    >
                      Configurar em Configurações → Atividades
                    </Link>
                  </span>
                </div>
              ) : (
                <Controller
                  name="descricao"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <SelectTrigger className={errors.descricao ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecionar tipo de atividade..." />
                      </SelectTrigger>
                      <SelectContent>
                        {atividadesPadrao.map((a) => (
                          <SelectItem key={a.id} value={a.nome}>
                            {a.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}

              {errors.descricao && (
                <p className="text-xs text-red-600">{errors.descricao.message}</p>
              )}

              {/* Show the template description as a hint */}
              {selectedPadrao?.descricao && (
                <p className="text-xs text-muted-foreground italic">
                  {selectedPadrao.descricao}
                </p>
              )}
            </div>

            {/* Observations */}
            <div className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Notas adicionais sobre esta atividade (opcional)..."
                rows={5}
                {...register('observacoes')}
              />
              {errors.observacoes && (
                <p className="text-xs text-red-600">{errors.observacoes.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !inqueritoid || atividadesPadrao.length === 0}
              >
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
