export default function CheckListModal({ checks, onClose }) {
  if (!checks || checks.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">19 Regulated KYC Verification Checks</h3>
            <p className="text-xs text-gray-500">DoT / TRAI & Airtel Regulated Onboarding Rules</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {checks.map((chk) => {
            const isPass = chk.passed || chk.result === 'pass';
            const isHardFail = chk.severity === 'fail' || chk.severity === 'HARD_FAIL';

            return (
              <div
                key={chk.id || chk.code}
                className={`p-3.5 rounded-lg border text-sm flex items-start gap-3 ${
                  isPass
                    ? 'bg-green-50/50 border-green-200'
                    : isHardFail
                    ? 'bg-red-50/50 border-red-200'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="mt-0.5 font-bold text-base">
                  {isPass ? '✓' : isHardFail ? '✗' : '⚠'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      {chk.id || chk.code}: {chk.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isPass
                          ? 'bg-green-100 text-green-800'
                          : isHardFail
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPass ? 'PASSED' : isHardFail ? 'HARD BLOCKER' : 'MANUAL REVIEW'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{chk.message || chk.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
