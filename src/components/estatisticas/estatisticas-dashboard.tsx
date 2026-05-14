'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EstadoBarChart, FasePieChart, BrigadaBarChart, NaturezaBarChart } from './charts'
import { AlertTriangle, FileText, Users } from 'lucide-react'

interface Brigada { id: string; nome: string }

interface Stats {
  total: number
  vencidos: number
  semInspetor: number
  porEstado: { estado: string; count: number }[]
  porFase: { fase: string; count: number }[]
  porBrigada: { brigadaId: string; nome: string; count: number }[]
  porNatureza: { natureza: string; count: number }[]
}

export function EstatisticasDashboard({ brigadas }: { brigadas: Brigada[] }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [brigadaFilter, setBrigadaFilter] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const fetchStats = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (brigadaFilter) params.set('brigadaId', brigadaFilter)
    if (dataInicio) params.set('dataInicio', dataInicio)
    if (dataFim) params.set('dataFim', dataFim)

    const res = await fetch(`/api/estatisticas?${params}`)
    if (res.ok) setStats(await res.json())
    setLoading(false)
  }, [brigadaFilter, dataInicio, dataFim])

  useEffect(() => { fetchStats() }, [fetchStats])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={brigadaFilter}
          onChange={(e) => setBrigadaFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Todas as brigadas</option>
          {brigadas.map((b) => (
            <option key={b.id} value={b.id}>{b.nome}</option>
          ))}
        </select>
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Data início"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Data fim"
        />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">A carregar...</div>
      ) : stats ? (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Vencidos</span>
                </div>
                <p className="text-3xl font-bold mt-1 text-red-600">{stats.vencidos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sem inspetor</span>
                </div>
                <p className="text-3xl font-bold mt-1">{stats.semInspetor}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts row 1 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <EstadoBarChart data={stats.porEstado} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Por Fase Processual</CardTitle>
              </CardHeader>
              <CardContent>
                <FasePieChart data={stats.porFase} />
              </CardContent>
            </Card>
          </div>

          {/* Charts row 2 */}
          <div className="grid gap-4 md:grid-cols-2">
            {stats.porBrigada.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Por Brigada</CardTitle>
                </CardHeader>
                <CardContent>
                  <BrigadaBarChart data={stats.porBrigada} />
                </CardContent>
              </Card>
            )}
            {stats.porNatureza.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Top Naturezas</CardTitle>
                </CardHeader>
                <CardContent>
                  <NaturezaBarChart data={stats.porNatureza} />
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
