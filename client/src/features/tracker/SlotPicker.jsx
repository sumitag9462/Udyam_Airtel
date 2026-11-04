import { useState } from 'react';
import { scheduleSlot } from './api.js';

export default function SlotPicker({ orderId, currentSlot, onSlotScheduled }) {
  // Generate next 5 business days
  const availableDays = [];
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    availableDays.push(d);
  }

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedWindow, setSelectedWindow] = useState('09:00 - 12:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timeWindows = [
    { id: '09:00 - 12:00', label: 'Morning (09:00 AM - 12:00 PM)', icon: '🌅' },
    { id: '12:00 - 16:00', label: 'Afternoon (12:00 PM - 04:00 PM)', icon: '☀️' },
    { id: '16:00 - 19:00', label: 'Evening (04:00 PM - 07:00 PM)', icon: '🌆' },
  ];

  const handleConfirmSlot = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetDate = availableDays[selectedDayIndex];
      const updatedOrder = await scheduleSlot(orderId, {
        slotDate: targetDate.toISOString(),
        timeWindow: selectedWindow,
      });
      if (onSlotScheduled) onSlotScheduled(updatedOrder);
    } catch (err) {
      setError(err.message || 'Failed to book slot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Select Installation Appointment</h3>
          <p className="text-xs text-gray-500">Choose a convenient date & window for the Airtel field technician visit</p>
        </div>
        {currentSlot?.slotDate && (
          <span className="text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold">
            ✓ Booked for {new Date(currentSlot.slotDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Date selector tabs */}
      <div className="mt-5">
        <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
          Available Dates (Next 5 Days)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {availableDays.map((d, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-3 rounded-xl border text-center transition ${
                  isSelected
                    ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="block text-[11px] font-semibold text-gray-400 uppercase">
                  {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <span className="block text-base font-bold text-gray-900 mt-0.5">
                  {d.getDate()}
                </span>
                <span className="block text-[11px] text-gray-500">
                  {d.toLocaleDateString('en-IN', { month: 'short' })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time window selector */}
      <div className="mt-5">
        <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
          Preferred Arrival Window
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {timeWindows.map((tw) => {
            const isSelected = selectedWindow === tw.id;
            return (
              <button
                key={tw.id}
                type="button"
                onClick={() => setSelectedWindow(tw.id)}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition ${
                  isSelected
                    ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-xl">{tw.icon}</span>
                <div>
                  <span className="text-xs font-semibold text-gray-900 block">{tw.label}</span>
                  <span className="text-[11px] text-gray-500">Technician confirmed</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleConfirmSlot}
          disabled={loading}
          className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
        >
          {loading ? 'Booking Slot...' : 'Confirm Installation Slot →'}
        </button>
      </div>
    </div>
  );
}
