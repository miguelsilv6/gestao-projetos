'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  prazoAlertaDias: z.coerce.number().int().min(1).max(365),
  backupScheduleCron: z.string().min(1),
  emailRemetenteNome: z.string().min(1),
  emailRemetenteAddr: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((d) => {
        reset({
          prazoAlertaDias: d.prazoAlertaDias,
          backupScheduleCron: d.backupScheduleCron,
          emailRemetenteNome: d.emailRemetenteNome,
          emailRemetenteAddr: d.emailRemetenteAddr,
        })
        setLoading(false)
      })
      .catch(() => {
        toast.error('Erro ao carregar configurações')
        setLoading(false)
      })
  }, [reset])

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'Erro ao guardar')
      return
    }

    toast.success('Configurações guardadas')
  }

  if (loading) return <div className="text-sm text-muted-foreground">A carregar...</div>

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground text-sm">Configurações do sistema</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prazos e Alertas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prazoAlertaDias">Alertar prazo com antecedência (dias)</Label>
              <Input
                id="prazoAlertaDias"
                type="number"
                min={1}
                max={365}
                {...register('prazoAlertaDias')}
              />
              {errors.prazoAlertaDias && (
                <p className="text-xs text-red-600">{errors.prazoAlertaDias.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="backupScheduleCron">Agendamento (cron expression)</Label>
              <Input
                id="backupScheduleCron"
                {...register('backupScheduleCron')}
                placeholder="0 2 * * *"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Ex: <code>0 2 * * *</code> = todos os dias às 02:00
              </p>
              {errors.backupScheduleCron && (
                <p className="text-xs text-red-600">{errors.backupScheduleCron.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email do sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="emailRemetenteNome">Nome do remetente</Label>
              <Input id="emailRemetenteNome" {...register('emailRemetenteNome')} />
              {errors.emailRemetenteNome && (
                <p className="text-xs text-red-600">{errors.emailRemetenteNome.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emailRemetenteAddr">Endereço de remetente</Label>
              <Input id="emailRemetenteAddr" type="email" {...register('emailRemetenteAddr')} />
              {errors.emailRemetenteAddr && (
                <p className="text-xs text-red-600">{errors.emailRemetenteAddr.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar configurações
        </Button>
      </form>
    </div>
  )
}
