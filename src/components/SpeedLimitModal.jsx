import { useState } from 'react'
import { setSpeedLimit } from '../services/api'

export default function SpeedLimitModal({ isOpen, onClose, user, onSave }) {
  const [rxLimit, setRxLimit] = useState('')
  const [txLimit, setTxLimit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!rxLimit || !txLimit) {
      setError('Ambos límites son requeridos')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      await setSpeedLimit(user.ip, parseInt(rxLimit), parseInt(txLimit))
      onSave()
      onClose()
    } catch (err) {
      setError('Error al establecer límite de velocidad')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Limitar velocidad para {user?.ip}</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rxLimit">
                Límite de descarga (RX) en Kbps
              </label>
              <input
                id="rxLimit"
                type="number"
                value={rxLimit}
                onChange={(e) => setRxLimit(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ej: 1024"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="txLimit">
                Límite de subida (TX) en Kbps
              </label>
              <input
                id="txLimit"
                type="number"
                value={txLimit}
                onChange={(e) => setTxLimit(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ej: 512"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}