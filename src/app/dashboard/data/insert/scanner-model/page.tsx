'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Monitor, Trash2, Loader } from 'lucide-react'

// Types
interface ScannerModel {
  id: string
  name: string
}

// Import server actions
import { getScannerModels, addScannerModel, deleteScannerModel } from '@/actions/addAndGetScannerModels' // Adjust path as needed

const ScannerModelsPage = () => {
  const [scannerModels, setScannerModels] = useState<ScannerModel[]>([])
  const [newModelName, setNewModelName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch scanner models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await getScannerModels()
        setScannerModels(models)
      } catch (error) {
        console.error('Failed to fetch scanner models:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchModels()
  }, [])

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newModelName.trim()) return

    setIsAdding(true)
    try {
      const newModel = await addScannerModel(newModelName.trim())
      setScannerModels(prev => [...prev, newModel])
      setNewModelName('')
    } catch (error) {
      console.error('Failed to add scanner model:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteModel = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteScannerModel(id)
      setScannerModels(prev => prev.filter(model => model.id !== id))
    } catch (error) {
      console.error('Failed to delete scanner model:', error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-green-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-gray-700 to-white mb-2">Scanner Models Management</h1>
          <p className="text-gray-400">Add and manage scanner models in your system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Scanner Model Form */}
          <div className="bg-gradient-to-br h-[250px] from-black/50 to-gray-800/20 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                <Plus className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Add New Scanner Model</h2>
            </div>

            <form onSubmit={handleAddModel} className="space-y-4">
              <div>
                <label htmlFor="modelName" className="block text-sm font-medium text-gray-300 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  id="modelName"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Enter scanner model name..."
                  className="w-full px-4 py-3 bg-gray-800/20 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={!newModelName.trim() || isAdding}
                className="cursor-pointer w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:bg-gray-500/30 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Scanner Model
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Scanner Models List */}
          <div className="bg-gradient-to-br rom-black/50 to-gray-800/20 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                <Monitor className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Scanner Models</h2>
              <span className="ml-auto bg-gray-700/50 text-gray-300 text-sm px-2 py-1 rounded-full">
                {scannerModels.length} models
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-green-400" />
                  <span className="ml-2 text-gray-400">Loading scanner models...</span>
                </div>
              ) : scannerModels.length === 0 ? (
                <div className="text-center py-8">
                  <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No scanner models found</p>
                  <p className="text-gray-500 text-sm">Add your first scanner model using the form</p>
                </div>
              ) : (
                scannerModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-4 bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30 rounded-lg transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-200 font-medium">{model.name}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      disabled={deletingId === model.id}
                      className="cursor-pointer opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {deletingId === model.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScannerModelsPage