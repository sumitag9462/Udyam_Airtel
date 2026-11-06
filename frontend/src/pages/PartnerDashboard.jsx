import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

export default function PartnerDashboard() {
  const { id: routeTaskId } = useParams();

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  // Form updates
  const [statusInput, setStatusInput] = useState('');
  const [opticalDbm, setOpticalDbm] = useState(-19.4);
  const [technicianNotes, setTechnicianNotes] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await apiRequest('/partner/tasks');
      const loadedTasks = res?.tasks || res?.data?.tasks || (Array.isArray(res) ? res : null);
      if (loadedTasks && loadedTasks.length) {
        setTasks(loadedTasks);
        if (routeTaskId) {
          const match = loadedTasks.find((t) => t.taskId === routeTaskId || t.orderId === routeTaskId);
          setSelectedTask(match || loadedTasks[0]);
        } else {
          setSelectedTask(loadedTasks[0]);
        }
      } else {
        // Fallback simulated partner tasks
        const demoTasks = [
          {
            taskId: 'TSK-94819A21',
            orderId: 'ORD-DEMO-01',
            orderNumber: 'ORD-2026-DEL-0481',
            status: 'INSTALL_IN_PROGRESS',
            customerPhone: '•••• ••8888',
            scheduledSlot: 'Morning (09:00 - 11:00)',
            siteAddress: 'Shop 14, Ring Road, Okhla Phase III, Delhi - 110020',
            telemetry: { opticalSignalDbm: -19.4, lightLossDb: 0.8, snrDb: 34.5 },
            updatedAt: new Date().toISOString(),
          },
          {
            taskId: 'TSK-33810B82',
            orderId: 'ORD-DEMO-02',
            orderNumber: 'ORD-2026-BLR-1932',
            status: 'FEASIBILITY_CONFIRMED',
            customerPhone: '•••• ••7777',
            scheduledSlot: 'Afternoon (14:00 - 16:00)',
            siteAddress: 'Unit 402, 100ft Road, Indiranagar, Bengaluru - 560038',
            telemetry: { opticalSignalDbm: -18.9, lightLossDb: 0.6, snrDb: 36.1 },
            updatedAt: new Date().toISOString(),
          },
          {
            taskId: 'TSK-77192C94',
            orderId: 'ORD-DEMO-03',
            orderNumber: 'ORD-2026-MUM-0199',
            status: 'INSTALL_SCHEDULED',
            customerPhone: '•••• ••9999',
            scheduledSlot: 'Evening (16:00 - 18:00)',
            siteAddress: 'Suite 12, Senapati Bapat Marg, Lower Parel, Mumbai - 400013',
            telemetry: { opticalSignalDbm: -20.1, lightLossDb: 1.1, snrDb: 32.8 },
            updatedAt: new Date().toISOString(),
          },
        ];
        setTasks(demoTasks);
        setSelectedTask(demoTasks[0]);
      }
    } catch {
      // Fallback demo tasks
      const demoTasks = [
        {
          taskId: 'TSK-94819A21',
          orderId: 'ORD-DEMO-01',
          orderNumber: 'ORD-2026-DEL-0481',
          status: 'INSTALL_IN_PROGRESS',
          customerPhone: '•••• ••8888',
          scheduledSlot: 'Morning (09:00 - 11:00)',
          siteAddress: 'Shop 14, Ring Road, Okhla Phase III, Delhi - 110020',
          telemetry: { opticalSignalDbm: -19.4, lightLossDb: 0.8, snrDb: 34.5 },
          updatedAt: new Date().toISOString(),
        },
      ];
      setTasks(demoTasks);
      setSelectedTask(demoTasks[0]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [routeTaskId]);

  useEffect(() => {
    if (selectedTask) {
      setStatusInput(selectedTask.status);
      setOpticalDbm(selectedTask.telemetry?.opticalSignalDbm || -19.4);
    }
  }, [selectedTask]);

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setUpdating(true);
      setMessage('');
      const targetId = selectedTask.orderId || selectedTask.taskId;
      await apiRequest(`/partner/tasks/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: statusInput,
          opticalSignalDbm: Number(opticalDbm),
          technicianNotes,
        }),
      });

      setMessage('Field task telemetry & optical reading updated successfully.');
      // Refresh local state
      setSelectedTask((prev) => ({
        ...prev,
        status: statusInput,
        telemetry: {
          ...prev.telemetry,
          opticalSignalDbm: Number(opticalDbm),
          lastTechnicianNote: technicianNotes,
        },
      }));
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === selectedTask.taskId
            ? { ...t, status: statusInput, telemetry: { ...t.telemetry, opticalSignalDbm: Number(opticalDbm) } }
            : t
        )
      );
    } catch {
      // Offline fallback: update local UI
      setMessage('Field task telemetry updated locally (Prototype Mode).');
      setSelectedTask((prev) => ({
        ...prev,
        status: statusInput,
        telemetry: {
          ...prev.telemetry,
          opticalSignalDbm: Number(opticalDbm),
          lastTechnicianNote: technicianNotes,
        },
      }));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link to="/" className="text-red-500 font-bold text-xl">
            Airtel
          </Link>
          <span className="text-slate-400">|</span>
          <span className="font-semibold text-white text-sm sm:text-base">Field Operations Desk</span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono bg-blue-900 text-blue-200 border border-blue-700 rounded">
            Role: Partner / Field Engineer
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <Link to="/backoffice" className="text-slate-300 hover:text-white">
            Back-Office Funnel
          </Link>
          <Link to="/tracker" className="text-slate-300 hover:text-white">
            Subscriber Tracker
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Queue */}
        <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-sm tracking-wider uppercase text-slate-300">
              Assigned Field Tasks ({tasks.length})
            </h2>
            <button
              onClick={fetchTasks}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Refresh
            </button>
          </div>

          <div className="divide-y divide-slate-700 max-h-[calc(100vh-200px)] overflow-y-auto">
            {tasks.map((t) => (
              <div
                key={t.taskId}
                onClick={() => setSelectedTask(t)}
                className={`p-4 cursor-pointer transition-all ${
                  selectedTask?.taskId === t.taskId
                    ? 'bg-slate-700 border-l-4 border-red-500'
                    : 'hover:bg-slate-750'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-xs font-bold text-white">{t.taskId}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                        : t.status === 'INSTALL_IN_PROGRESS'
                        ? 'bg-amber-900 text-amber-300 border border-amber-700'
                        : 'bg-blue-900 text-blue-300 border border-blue-700'
                    }`}
                  >
                    {t.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mb-1">{t.orderNumber}</div>
                <div className="text-xs text-slate-300 truncate mb-1">📍 {t.siteAddress}</div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Slot: {t.scheduledSlot}</span>
                  <span className="font-mono text-emerald-400">
                    {t.telemetry?.opticalSignalDbm} dBm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Task Details & Telemetry Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTask ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b border-slate-700">
                <div>
                  <div className="text-xs font-mono text-red-400 uppercase tracking-wider font-bold mb-1">
                    Task Details & Optical Telemetry
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-white mb-1">
                    {selectedTask.orderNumber} ({selectedTask.taskId})
                  </h1>
                  <p className="text-xs text-slate-400">
                    Customer Contact: {selectedTask.customerPhone} · Slot: {selectedTask.scheduledSlot}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-400">Installation Address</div>
                  <div className="text-xs font-semibold text-slate-200">{selectedTask.siteAddress}</div>
                </div>
              </div>

              {/* Live Optical Telemetry Gauges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Optical Power (dBm)</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {selectedTask.telemetry?.opticalSignalDbm || -19.4} <span className="text-xs text-slate-500">dBm</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Acceptable: -14 to -24 dBm</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Splice Light Loss</div>
                  <div className="text-2xl font-bold font-mono text-blue-400">
                    {selectedTask.telemetry?.lightLossDb || 0.8} <span className="text-xs text-slate-500">dB</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Threshold: &lt; 1.5 dB</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Optical SNR</div>
                  <div className="text-2xl font-bold font-mono text-purple-400">
                    {selectedTask.telemetry?.snrDb || 34.5} <span className="text-xs text-slate-500">dB</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Nominal: &gt; 30 dB</div>
                </div>
              </div>

              {/* Update Status & Telemetry Form */}
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-700 pb-2">
                  Field Technician Telemetry Input
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Installation Stage Status
                    </label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="FEASIBILITY_CHECK">Feasibility Check</option>
                      <option value="INSTALL_SCHEDULED">Install Scheduled</option>
                      <option value="INSTALLED">Installed (Physical Splicing Complete)</option>
                      <option value="ACTIVATED">Activated (Signal Verified & Handover Complete)</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Calibrated Optical Signal (dBm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={opticalDbm}
                      onChange={(e) => setOpticalDbm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Technician Field Notes & ONT Serial
                  </label>
                  <textarea
                    rows={3}
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    placeholder="e.g. Optical fiber spliced successfully at splitter port 4; ONT provisioned and speed tested at 104 Mbps symmetric."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {message && (
                  <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-lg text-xs text-emerald-300">
                    {message}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all disabled:bg-slate-700"
                  >
                    {updating ? 'Saving Telemetry...' : 'Record Telemetry & Update Status'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center text-slate-400 text-sm">
              Select a field task from the queue to inspect optical telemetry and update progress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
