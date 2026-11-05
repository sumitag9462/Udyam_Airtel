import { useState } from 'react';
import { updateLeadStatus } from './api.js';

export default function UnclosedLeadsTable({ leadsData, onLeadUpdated }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [advisorStatus, setAdvisorStatus] = useState('open');
  const [note, setNote] = useState('');
  const [modalError, setModalError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [filterSegment, setFilterSegment] = useState('');
  const [filterSource, setFilterSource] = useState('');

  if (!leadsData) return null;

  const { leads, modelInfo } = leadsData;

  const filteredLeads = leads.filter((l) => {
    if (filterSegment && l.segment !== filterSegment) return false;
    if (filterSource && l.leadSource !== filterSource) return false;
    return true;
  });

  const handleSaveStatus = async () => {
    if (!selectedLead) return;
    setUpdating(true);
    setModalError(null);
    try {
      await updateLeadStatus(selectedLead._id, { advisorStatus, note });
      setSelectedLead(null);
      setNote('');
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      setModalError(err.message || 'Failed to update lead');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Unclosed Leads Recovery Queue</h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              ML Model AUC: {modelInfo?.rocAuc || 0.688}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Ranked by statistical activation propensity. High-propensity drop-offs prioritized for proactive advisor intervention.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterSegment}
            onChange={(e) => setFilterSegment(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-xs text-gray-700 bg-white"
          >
            <option value="">All Segments</option>
            <option value="prof">Professional Offices</option>
            <option value="mfg">Manufacturers</option>
            <option value="multi">Multi-Site</option>
            <option value="micro">Micro Retail</option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 text-xs text-gray-700 bg-white"
          >
            <option value="">All Sources</option>
            <option value="Referral">Referral</option>
            <option value="Inbound call">Inbound Call</option>
            <option value="Channel partner">Channel Partner</option>
            <option value="Field sales">Field Sales</option>
            <option value="Website form">Website Form</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500 tracking-wider">
            <tr>
              <th className="px-6 py-3.5">Propensity</th>
              <th className="px-6 py-3.5">Business Name & Scale</th>
              <th className="px-6 py-3.5">Channel / Segment</th>
              <th className="px-6 py-3.5">Stage Lost / Drop Reason</th>
              <th className="px-6 py-3.5">Top Model Drivers</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLeads.slice(0, 25).map((lead) => {
              const pct = lead.propensityPercentage;
              const isHigh = pct >= 12;
              const isMed = pct >= 7 && pct < 12;

              return (
                <tr key={lead._id} className="hover:bg-gray-50/70 transition">
                  {/* Propensity badge */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                          isHigh
                            ? 'bg-emerald-100 text-emerald-800'
                            : isMed
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </td>

                  {/* Business Name */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 text-sm">{lead.businessName}</div>
                    <div className="text-xs text-gray-500">
                      {lead.city} (Tier {lead.cityTier}) • {lead.employeeCount} emp • {lead.numSites} sites
                    </div>
                  </td>

                  {/* Source & Segment */}
                  <td className="px-6 py-4 text-xs">
                    <span className="font-semibold text-gray-800">{lead.leadSource}</span>
                    <span className="block text-gray-500 capitalize">{lead.segment}</span>
                  </td>

                  {/* Stage reached & drop */}
                  <td className="px-6 py-4 text-xs">
                    <span className="font-medium text-gray-800 block">{lead.stageReached}</span>
                    <span className="text-red-600 block text-[11px]">
                      {lead.dropReason || 'In progress'}
                    </span>
                  </td>

                  {/* Top transparent model drivers */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {lead.propensityDrivers?.slice(0, 3).map((d, i) => (
                        <span
                          key={i}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            d.positive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {d.positive ? '+' : '-'} {d.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLead(lead);
                        setAdvisorStatus(lead.advisorStatus || 'open');
                        setNote('');
                      }}
                      className="px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-xs font-semibold transition"
                    >
                      Intervene →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Intervention Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Advisor Intervention</h3>
                <p className="text-xs text-gray-500">{selectedLead.businessName} (Propensity: {selectedLead.propensityPercentage}%)</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4">
              {modalError && (
                <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Advisor Pipeline Status
                </label>
                <select
                  value={advisorStatus}
                  onChange={(e) => setAdvisorStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                >
                  <option value="open">Open (Unassigned)</option>
                  <option value="handoff_requested">Handoff Requested (High Intent)</option>
                  <option value="ordered">Ordered & Converted</option>
                  <option value="kyc_blocked">KYC Blocked (Document Help Needed)</option>
                  <option value="no_valid_bundle">Custom Bundle Required</option>
                  <option value="abandoned">Mark Abandoned</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Advisor Activity Note
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Called business owner; answered questions regarding 3-year contract terms."
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleSaveStatus}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save & Assign Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
