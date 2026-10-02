import type { Campeonato } from '../api/campeonatos'

// monta pelas partes porque new Date('AAAA-MM-DD') usa UTC e volta um dia
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR')
}

export function sortCampeonatos(campeonatos: Campeonato[]): Campeonato[] {
  return [...campeonatos].sort(
    (a, b) =>
      Number(a.encerrado) - Number(b.encerrado) || b.data_inicio.localeCompare(a.data_inicio),
  )
}

// tira os acentos pra 'varzea' achar 'Várzea'
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export function filterCampeonatos(campeonatos: Campeonato[], statusFilter: string, search: string): Campeonato[] {
  const term = normalizeText(search)
  const filtered = campeonatos.filter((campeonato) => {
    if (statusFilter === 'andamento' && campeonato.encerrado) return false
    if (statusFilter === 'encerrados' && !campeonato.encerrado) return false
    return normalizeText(campeonato.nome).includes(term)
  })
  return sortCampeonatos(filtered)
}
