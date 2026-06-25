import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePortalAuth } from '../../contexts/PortalAuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: 'Agendada',
  CHECKIN_REALIZADO: 'Check-in realizado',
  PREPARACAO_ANESTESICA: 'Preparação anestésica',
  EM_CIRURGIA: 'Em cirurgia',
  RECUPERACAO: 'Em recuperação',
  INTERNACAO: 'Internação',
  ALTA_CONCEDIDA: 'Alta concedida',
  CANCELADA: 'Cancelada',
}

const STATUS_COLOR: Record<string, string> = {
  AGENDADA: 'bg-blue-100 text-blue-700',
  CHECKIN_REALIZADO: 'bg-yellow-100 text-yellow-700',
  PREPARACAO_ANESTESICA: 'bg-orange-100 text-orange-700',
  EM_CIRURGIA: 'bg-red-100 text-red-700',
  RECUPERACAO: 'bg-purple-100 text-purple-700',
  INTERNACAO: 'bg-pink-100 text-pink-700',
  ALTA_CONCEDIDA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
}

export default function PortalDashboard() {
  const { token, user, logout } = usePortalAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { navigate('/portal/login'); return }
    fetch(`${API}/api/portal-auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => { logout(); navigate('/portal/login') })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Carregando...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-bold text-lg">Portal do Responsável</div>
            <div className="text-indigo-200 text-sm">Olá, {user?.name?.split(' ')[0]}!</div>
          </div>
          <button onClick={() => { logout(); navigate('/portal/login') }} className="text-indigo-200 hover:text-white text-sm">
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Meus Pets</h2>

        {data?.patients?.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400">
            Nenhum paciente cadastrado ainda.
          </div>
        )}

        {data?.patients?.map((patient: any) => {
          const lastSurgery = patient.surgeries?.[0]
          const lastStatus = lastSurgery?.statusHistory?.[0]

          return (
            <Link
              key={patient.id}
              to={`/portal/paciente/${patient.id}`}
              className="block bg-white rounded-xl shadow-sm hover:shadow-md transition p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold flex-shrink-0">
                  {patient.species === 'FELINO' ? '🐱' : patient.species === 'CANINO' ? '🐶' : '🐾'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-500">{patient.breed || patient.species}</div>

                  {lastSurgery && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[lastSurgery.status] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[lastSurgery.status] || lastSurgery.status}
                      </span>
                      {lastStatus && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{lastStatus.message}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    {patient.budgets?.length > 0 && <span>📋 {patient.budgets.length} orçamento(s)</span>}
                    {patient.surgeries?.length > 0 && <span>🔪 {patient.surgeries.length} cirurgia(s)</span>}
                    {patient.records?.length > 0 && <span>📄 {patient.records.length} documento(s)</span>}
                  </div>
                </div>
                <div className="text-gray-300 text-lg">›</div>
              </div>
            </Link>
          )
        })}

        <p className="text-center text-xs text-gray-400 pt-4">
          NOVUS Cirurgia Veterinária · Portal do Responsável
        </p>
      </main>
    </div>
  )
}
