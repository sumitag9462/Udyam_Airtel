import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../api/client.js';

export default function AdvisorChat() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({});
  const [, setTiers] = useState(null);
  const [handoff, setHandoff] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    const isHi = i18n.language === 'hi';
    setMessages([
      {
        role: 'assistant',
        text: isHi
          ? 'Namaste! Main Airtel Udyam One digital advisor hoon. Aapka kis cheez ka business hai aur kis city me sthit hai?'
          : 'Welcome to Airtel Udyam One. I am your business connectivity advisor. What type of business do you operate, and in which city are you located?',
        createdAt: new Date(),
      },
    ]);
  }, [i18n.language]);

  // Scroll to bottom when message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: 'user',
      text: textToSend.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');
    setLoading(true);

    try {
      const res = await apiRequest('/advisor/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          message: textToSend.trim(),
          language: i18n.language || 'en',
        }),
      });

      setConversationId(res.conversationId);
      if (res.profile) setProfile(res.profile);
      if (res.tiers) setTiers(res.tiers);
      if (res.handoffRequested) setHandoff(true);

      const assistantMsg = {
        role: 'assistant',
        text: res.reply,
        tiers: res.tiers,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I apologize, but an error occurred while connecting to the Airtel rules service. Please try again or proceed to direct quote selection.',
          error: true,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const quickReplies = [
    'We are a dental clinic in Delhi with 5 staff',
    'Kirana shop in Jaipur with 2 people, budget ₹1,500',
    'We need automated 4G backup failover',
    'I want to speak with a human advisor',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-3xl mx-auto bg-white border-x border-divider overflow-hidden">
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

        <button
          type="button"
          onClick={() => navigate('/quotes')}
          className="text-xs text-airtel-red font-semibold hover:underline whitespace-nowrap ml-2"
        >
          Skip to Quote →
        </button>
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
                            onClick={() => navigate('/quotes')}
                            className="mt-3 text-[11px] font-semibold bg-gray-900 text-white py-1 px-2 rounded hover:bg-black"
                          >
                            Select Plan
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
  );
}
