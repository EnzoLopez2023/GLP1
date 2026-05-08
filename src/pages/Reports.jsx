import { useState } from 'react'
import PageHero from '../components/motion/PageHero'
import { api } from '../api/client'
import { useQuery } from '../hooks/useQuery'
import { downloadJSON, downloadCSV, readFile } from '../utils/exportHelpers'
import { toDateStr } from '../utils/dateHelpers'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { FileText, Download, Upload, Droplets, Syringe, Scale } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Reports() {
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile]           = useState(null)

  const { data: glucose }    = useQuery(api.getGlucose)
  const { data: injections } = useQuery(() => api.getInjections(200))
  const { data: weights }    = useQuery(api.getWeightLog)

  const cutoff30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const recentGlucose    = (glucose    ?? []).filter(r => r.readingAt  >= cutoff30)
  const recentInjections = (injections ?? []).filter(i => i.injectedAt >= cutoff30)

  const glucoseAvg   = recentGlucose.length ? Math.round(recentGlucose.reduce((s,r) => s+r.value,0)/recentGlucose.length) : null
  const fastingAvg   = (() => { const f = recentGlucose.filter(r=>r.readingType==='fasting'); return f.length ? Math.round(f.reduce((s,r)=>s+r.value,0)/f.length) : null })()
  const postMealAvg  = (() => { const f = recentGlucose.filter(r=>r.readingType==='post-meal'); return f.length ? Math.round(f.reduce((s,r)=>s+r.value,0)/f.length) : null })()
  const highReadings = recentGlucose.filter(r => r.value > 125).length
  const lowReadings  = recentGlucose.filter(r => r.value < 70).length

  async function handleFullExport() {
    const data = await api.exportData()
    downloadJSON(data, `glp1-full-backup-${toDateStr()}.json`)
    toast.success('Full backup exported!')
  }

  async function handleGlucoseCSV() {
    const rows = (glucose ?? []).map(r => ({
      Date: r.readingAt.slice(0,10), Time: r.readingAt.slice(11,16),
      'Value (mg/dL)': r.value, Type: r.readingType, Notes: r.notes ?? '',
    }))
    downloadCSV(rows, `glucose-${toDateStr()}.csv`)
    toast.success('Glucose CSV exported!')
  }

  async function handleInjectionCSV() {
    const rows = (injections ?? []).map(i => ({
      Date: i.injectedAt.slice(0,10), Time: i.injectedAt.slice(11,16),
      Medication: i.medicationName, 'Dose (mg)': i.doseMg, Site: i.site, Notes: i.notes ?? '',
    }))
    downloadCSV(rows, `injections-${toDateStr()}.csv`)
    toast.success('Injections CSV exported!')
  }

  async function handleWeightCSV() {
    const rows = (weights ?? []).map(w => ({
      Date: w.date, 'Weight (lbs)': w.weightLbs, Notes: w.notes ?? '',
    }))
    downloadCSV(rows, `weight-${toDateStr()}.csv`)
    toast.success('Weight CSV exported!')
  }

  async function handleImport() {
    if (!importFile) { toast.error('Please select a file'); return }
    try {
      const text = await readFile(importFile)
      await api.importData(JSON.parse(text))
      toast.success('Data imported! Refresh to see changes.')
      setShowImportModal(false)
    } catch (err) {
      toast.error('Import failed: ' + err.message)
    }
  }

  return (
    <PageHero variant="reports">
    <div className="space-y-5">

      <Card>
        <CardHeader title="30-Day Glucose Summary" />
        <div className="grid grid-cols-2 gap-4">
          {[
            { label:'All Readings Avg', value: glucoseAvg,          unit:'mg/dL' },
            { label:'Fasting Avg',      value: fastingAvg,          unit:'mg/dL' },
            { label:'Post-Meal Avg',    value: postMealAvg,         unit:'mg/dL' },
            { label:'Total Readings',   value: recentGlucose.length,unit:''      },
            { label:'High Readings',    value: highReadings,        unit:'>125'  },
            { label:'Low Readings',     value: lowReadings,         unit:'<70'   },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">
                {value ?? '—'} <span className="text-xs font-normal text-gray-400">{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Medication Adherence (30 days)" />
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-brand-600">{recentInjections.length}</p>
            <p className="text-xs text-gray-500">Injections logged</p>
          </div>
          <div className="flex-1 text-sm text-gray-600">
            <p>Expected: ~4 injections/month</p>
            <p className="mt-1">
              Adherence: <span className="font-semibold">
                {Math.min(100, Math.round(recentInjections.length / 4 * 100))}%
              </span>
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Export Data" />
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-brand-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">Full Backup (JSON)</p>
                <p className="text-xs text-gray-500">All data — use for backup & restore</p>
              </div>
            </div>
            <Button size="sm" onClick={handleFullExport}><Download size={14} /> Export</Button>
          </div>
          {[
            { label:'Glucose Readings',  desc:'All readings as CSV',   icon: Droplets, fn: handleGlucoseCSV },
            { label:'Injection History', desc:'All injections as CSV',  icon: Syringe,  fn: handleInjectionCSV },
            { label:'Weight Log',        desc:'Weight history as CSV',  icon: Scale,    fn: handleWeightCSV },
          ].map(({ label, desc, icon: Icon, fn }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={fn}><Download size={14} /> CSV</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Import Data" />
        <p className="text-xs text-gray-500 mb-3">
          Restore from a previous JSON backup. <strong>This will replace all existing data.</strong>
        </p>
        <Button variant="outline" onClick={() => setShowImportModal(true)}>
          <Upload size={16} /> Import Backup
        </Button>
      </Card>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Backup" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl text-xs text-red-700">
            ⚠️ Importing will replace ALL existing data. Export a backup first if needed.
          </div>
          <input type="file" accept=".json" onChange={e => setImportFile(e.target.files[0])}
            className="block w-full text-sm text-gray-700" />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleImport}>Import & Replace</Button>
          </div>
        </div>
      </Modal>
    </div>
    </PageHero>
  )
}
