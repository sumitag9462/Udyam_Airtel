import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../api/client.js';

export default function AdvisorChat() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [conversationId, setConversationId] = useState(() => sessionStorage.getItem('udyam_advisor_conversationId') || null);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('udyam_advisor_messages');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('udyam_advisor_profile') || '{}');
    } catch {
      return {};
    }
  });
  const [tiers, setTiers] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('udyam_advisor_tiers') || 'null');
    } catch {
      return null;
    }
  });
  const [handoff, setHandoff] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sendingRef = useRef(false);

  const getWelcomeText = (lang) => {
    return (lang || '').startsWith('hi')
      ? 'Namaste! Main Airtel Udyam One digital advisor hoon. Aapka kis cheez ka business hai aur kis city me sthit hai?'
      : 'Welcome to Airtel Udyam One. I am your business connectivity advisor. What type of business do you operate, and in which city are you located?';
  };

  // Initial welcome message appears strictly once per new conversation
  useEffect(() => {
    if (messages.length === 0) {
      const isHi = (i18n.language || '').startsWith('hi');
      const welcome = [
        {
          role: 'assistant',
          text: getWelcomeText(isHi ? 'hi' : 'en'),
          isWelcome: true,
          createdAt: new Date(),
        },
      ];
      setMessages(welcome);
      sessionStorage.setItem('udyam_advisor_messages', JSON.stringify(welcome));
    }
  }, []);

  // Update initial welcome message language if user changes language before sending first message
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant' && messages[0].isWelcome) {
      const isHi = (i18n.language || '').startsWith('hi');
      const targetText = getWelcomeText(isHi ? 'hi' : 'en');
      if (messages[0].text !== targetText) {
        const updated = [{ ...messages[0], text: targetText }];
        setMessages(updated);
        sessionStorage.setItem('udyam_advisor_messages', JSON.stringify(updated));
      }
    }
  }, [i18n.language]);

  // Restore conversation from server if conversationId exists but messages only has welcome
  useEffect(() => {
    if (conversationId && messages.length <= 1) {
      const sSecret = sessionStorage.getItem('udyam_advisor_sessionSecret');
      const headers = sSecret ? { 'X-Session-Secret': sSecret } : {};
      apiRequest(`/advisor/conversations/${conversationId}`, { headers })
        .then((data) => {
          if (data?.conversation?.messages?.length > 0) {
            const formatted = data.conversation.messages.map((m) => ({
              role: m.role,
              text: m.text,
              createdAt: m.createdAt,
            }));
            setMessages(formatted);
            sessionStorage.setItem('udyam_advisor_messages', JSON.stringify(formatted));
            if (data.conversation.profile) {
              setProfile(data.conversation.profile);
              sessionStorage.setItem('udyam_advisor_profile', JSON.stringify(data.conversation.profile));
            }
          }
        })
        .catch(() => {
          // Keep local state on error
        });
    }
  }, [conversationId]);

  // Scroll to bottom when message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const updateMessages = (updater) => {
    setMessages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        sessionStorage.setItem('udyam_advisor_messages', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleResetConversation = () => {
    sessionStorage.removeItem('udyam_advisor_conversationId');
    sessionStorage.removeItem('udyam_advisor_sessionSecret');
    sessionStorage.removeItem('udyam_advisor_profile');
    sessionStorage.removeItem('udyam_advisor_tiers');
    sessionStorage.removeItem('udyam_advisor_messages');
    sessionStorage.removeItem('udyam_selected_tier');
    setConversationId(null);
    setProfile({});
    setTiers(null);
    setHandoff(false);
    const isHi = (i18n.language || '').startsWith('hi');
    const welcome = [
      {
        role: 'assistant',
        text: getWelcomeText(isHi ? 'hi' : 'en'),
        isWelcome: true,
        createdAt: new Date(),
      },
    ];
    setMessages(welcome);
    sessionStorage.setItem('udyam_advisor_messages', JSON.stringify(welcome));
  };

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading || sendingRef.current) return;

    sendingRef.current = true;
    const userMsg = {
      role: 'user',
      text: textToSend.trim(),
      createdAt: new Date(),
    };

    updateMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');
    setLoading(true);

    try {
      const payload = {
        message: textToSend.trim(),
        language: (i18n.language || 'en').startsWith('hi') ? 'hi' : 'en',
      };
      if (conversationId) payload.conversationId = conversationId;
      const sSecret = sessionStorage.getItem('udyam_advisor_sessionSecret');
      if (sSecret) payload.sessionSecret = sSecret;

      const res = await apiRequest('/advisor/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.conversationId) {
        setConversationId(res.conversationId);
        sessionStorage.setItem('udyam_advisor_conversationId', res.conversationId);
      }
      if (res.sessionSecret) {
        sessionStorage.setItem('udyam_advisor_sessionSecret', res.sessionSecret);
      }
      if (res.profile) {
        setProfile(res.profile);
        sessionStorage.setItem('udyam_advisor_profile', JSON.stringify(res.profile));
      }
      if (res.tiers) {
        setTiers(res.tiers);
        sessionStorage.setItem('udyam_advisor_tiers', JSON.stringify(res.tiers));
      }
      if (res.handoffRequested) setHandoff(true);

      const isCurrentHi = (i18n.language || '').startsWith('hi');
      const safeReply =
        res?.reply && typeof res.reply === 'string' && res.reply.trim().length > 0
          ? res.reply
          : isCurrentHi
          ? 'Kripya apne business ke baare mein aur jaankari dein taaki hum sahi plan suggest kar sakein.'
          : 'Could you please share a few more details about your business so we can calculate the best plan for you?';

      const assistantMsg = {
        role: 'assistant',
        text: safeReply,
        tiers: res.tiers,
        createdAt: new Date(),
      };
      updateMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      updateMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I encountered an issue connecting to the Airtel rules service (${err.message || 'Network error'}). Please try again or select plans directly.`,
          error: true,
          failedText: textToSend.trim(),
          createdAt: new Date(),
        },
      ]);
    } finally {
      sendingRef.current = false;
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const quickReplies = [
    'We have a law office in Delhi with 14 employees and one location. We need business internet, email and cloud backup. Our maximum budget is ₹5,000 per month.',
    'Dental clinic in Delhi with 5 staff',
    'Kirana shop in Jaipur with 2 people, budget ₹1,500',
    'We need automated 4G backup failover',
    'I want to speak with a human advisor',
  ];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] w-full max-w-6xl mx-auto bg-white border-x border-divider overflow-hidden">
      {/* Primary Chat Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Banner with Extracted Profile Badges */}
        <div className="p-3 bg-gray-50 border-b border-divider flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-1 min-w-0">
            <span className="font-bold text-primary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              AI Advisor
            </span>
            {profile.businessType && (
              <span className="bg-white border border-divider px-2 py-0.5 rounded text-secondary font-medium">
                {profile.businessType}
              </span>
            )}
            {profile.city && (
              <span className="bg-white border border-divider px-2 py-0.5 rounded text-secondary font-medium">
                📍 {profile.city} (Tier {profile.cityTier || 1})
              </span>
            )}
            {profile.employeeCount && (
              <span className="bg-white border border-divider px-2 py-0.5 rounded text-secondary font-medium">
                👥 {profile.employeeCount} staff
              </span>
            )}
            {profile.hasGstin !== undefined && (
              <span className="bg-white border border-divider px-2 py-0.5 rounded text-secondary font-medium">
                GSTIN: {profile.hasGstin ? '✓ Active' : '✗ None'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextLang = (i18n.language || '').startsWith('hi') ? 'en' : 'hi';
                i18n.changeLanguage(nextLang);
              }}
              className="px-2 py-0.5 text-[11px] font-semibold rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Toggle Hindi/English"
            >
              {(i18n.language || '').startsWith('hi') ? 'English' : 'हिंदी'}
            </button>
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handleResetConversation}
                className="text-xs text-secondary hover:text-dark-red hover:underline whitespace-nowrap"
                title="Start a fresh discovery session"
              >
                Reset
              </button>
            )}
            {!handoff && (
              <button
                type="button"
                onClick={() => handleSendMessage('I want to speak with a human advisor')}
                className="text-xs text-secondary hover:text-primary underline whitespace-nowrap hidden sm:inline"
              >
                Talk to a person
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem('udyam_advisor_profile', JSON.stringify(profile));
                if (tiers) sessionStorage.setItem('udyam_advisor_tiers', JSON.stringify(tiers));
                navigate('/quotes', { state: { profile, tier: tiers?.[0]?.tierLabel || 'standard' } });
              }}
              className="text-xs text-airtel-red font-semibold hover:underline whitespace-nowrap ml-1"
            >
              {profile.businessType && profile.city ? 'View Plan Quotes →' : 'Set up my quote →'}
            </button>
          </div>
        </div>

        {/* Human Handoff Banner */}
        {handoff && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>
              <strong>Human Handoff Active:</strong> An Airtel Account Manager has been notified and will call you directly.
            </span>
            <span className="text-[11px] font-semibold bg-amber-200 px-2 py-0.5 rounded">Priority Callback</span>
          </div>
        )}

        {/* Message Stream */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          role="log"
          aria-live="polite"
          aria-label="Conversation with Airtel Advisor"
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    isUser
                      ? 'bg-primary text-white rounded-tr-none'
                      : msg.error
                      ? 'bg-red-50 text-dark-red border border-red-200 rounded-tl-none'
                      : 'bg-gray-100 text-primary rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {msg.error && msg.failedText && (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(msg.failedText)}
                      className="mt-2 text-xs font-semibold text-airtel-red underline hover:text-dark-red block"
                    >
                      ↻ Retry sending
                    </button>
                  )}

                  {/* Inline Recommendation Cards when tiers returned */}
                  {msg.tiers && msg.tiers.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                        Suggested Airtel Business Plans:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {msg.tiers.map((tier) => (
                          <div
                            key={tier.tierLabel}
                            className="bg-white p-3 rounded-lg border border-divider flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-xs font-bold text-primary capitalize block">
                                {tier.tierLabel}
                              </span>
                              <span className="text-base font-extrabold text-airtel-red mt-1 block">
                                ₹{tier.monthlyTotal.toLocaleString('en-IN')}/mo
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                sessionStorage.setItem('udyam_selected_tier', tier.tierLabel);
                                navigate('/quotes', { state: { tier: tier.tierLabel, profile } });
                              }}
                              className="mt-3 text-[11px] font-semibold bg-gray-900 text-white py-1 px-2 rounded hover:bg-black transition-colors"
                            >
                              Select Plan →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-secondary mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-secondary py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-airtel-red animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-airtel-red animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-airtel-red animate-bounce delay-200" />
              <span>Consulting Airtel rules engine...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Chips */}
        {messages.length < 3 && !loading && (
          <div className="px-4 py-2 border-t border-divider bg-gray-50 flex gap-2 overflow-x-auto text-xs min-w-0">
            {quickReplies.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                className="bg-white border border-divider hover:border-airtel-red px-3 py-1.5 rounded-full text-secondary hover:text-primary whitespace-nowrap transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-divider bg-white flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('advisor.inputPlaceholder', 'Tell us about your business or requirements...')}
            disabled={loading}
            className="flex-1 input-field py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="btn-primary py-2.5 px-5 text-sm font-semibold rounded whitespace-nowrap"
          >
            {loading ? '...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Right Column: Live Business Profile Summary (Desktop) */}
      <aside className="hidden md:flex w-80 border-l border-divider bg-gray-50 flex-col justify-between p-5 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                Live Business Profile
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Rules Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-primary mt-1">
              {profile.businessType || 'Assessing Requirements...'}
            </h3>
          </div>

          <div className="bg-white border border-divider rounded-lg p-3 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-secondary">Segment:</span>
              <span className="font-semibold text-primary uppercase">
                {profile.segment || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Location:</span>
              <span className="font-semibold text-primary">
                {profile.city ? `${profile.city} (Tier ${profile.cityTier || 1})` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Scale:</span>
              <span className="font-semibold text-primary">
                {profile.employeeCount ? `${profile.employeeCount} staff · ${profile.numSites || 1} site` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">GSTIN Status:</span>
              <span className="font-semibold text-primary">
                {profile.hasGstin !== undefined ? (profile.hasGstin ? 'Active' : 'Unregistered') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Monthly Budget:</span>
              <span className="font-semibold text-primary">
                {profile.budgetMonthly ? `₹${profile.budgetMonthly.toLocaleString('en-IN')}` : 'Flexible'}
              </span>
            </div>
            {profile.mustHaves?.length > 0 && (
              <div className="pt-2 border-t border-divider">
                <span className="text-secondary block mb-1">Must-Haves:</span>
                <div className="flex flex-wrap gap-1">
                  {profile.mustHaves.map((mh) => (
                    <span key={mh} className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {mh.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {tiers && tiers.length > 0 && (
            <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-airtel-red block">
                Recommended Solution
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold capitalize text-primary">
                  {tiers[1]?.tierLabel || tiers[0]?.tierLabel}
                </span>
                <span className="text-base font-extrabold text-airtel-red">
                  ₹{((tiers[1]?.monthlyTotal || tiers[0]?.monthlyTotal) || 0).toLocaleString('en-IN')}/mo
                </span>
              </div>
              <p className="text-[11px] text-secondary">
                Meets all verified requirements within budget.
              </p>
              <button
                type="button"
                onClick={() => navigate('/quotes', { state: { profile, tier: tiers[1]?.tierLabel || tiers[0]?.tierLabel } })}
                className="w-full mt-2 py-2 bg-airtel-red text-white text-xs font-semibold rounded hover:bg-dark-red transition-colors"
              >
                Proceed to Custom Quote →
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-divider space-y-2 text-xs">
          <button
            type="button"
            onClick={() => handleSendMessage('I want to speak with a human advisor')}
            className="w-full py-2 border border-divider hover:border-gray-400 bg-white text-secondary hover:text-primary font-medium rounded text-xs transition-colors"
          >
            Request Human Advisor Callback
          </button>
          <p className="text-[10px] text-secondary text-center">
            Guided by Airtel Rules Engine · DPDP Compliant
          </p>
        </div>
      </aside>
    </div>
  );
}
