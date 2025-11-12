import { useMutation } from '@apollo/client';
import React from 'react';
import { SEND_CONTACT_MESSAGE } from '../graphql/support';
import { useToast } from '../components/ui/Toast';
import Input from '../components/ui/Input';

export default function CustomerService() {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [send, { loading }] = useMutation(SEND_CONTACT_MESSAGE);
  const { showToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await send({ variables: { ...form, message: form.message || '' } });
      showToast(
        'Message sent to support. We will get back to you shortly.',
        'success',
        { title: 'Sent' },
      );
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (e) {
      showToast('Failed to send your message. Please try again.', 'error');
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-6xl px-4 py-12 mx-auto space-y-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 border rounded-full theme-border">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              style={{ color: 'rgb(var(--brand-700))' }}
              aria-hidden
            >
              <path d="M21.75 6.75v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0l-9.72 6.48a.75.75 0 0 1-.84 0L2.25 6.75" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            How can we help?
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            We're here to assist you with any questions or concerns. Explore our
            FAQs or get in touch with our dedicated support team.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="bg-white border shadow-sm theme-border rounded-2xl">
              <div className="px-6 py-5 text-lg font-semibold border-b">
                Frequently Asked Questions
              </div>
              <div className="divide-y">
                {[
                  {
                    q: 'How can I track my order?',
                    a: 'Track your orders from your account dashboard under Orders. Each order shows real-time updates such as Processing, Shipped, and Delivered.',
                  },
                  {
                    q: 'Can I change my delivery location after placing an order?',
                    a: 'If your order has not been dispatched, reach out to us via the contact form and we will update your delivery location and applicable delivery fee.',
                  },
                  {
                    q: 'How do I apply a promo or gift code?',
                    a: 'Enter your code in the Order Summary panel at checkout before selecting “Continue to Payment.” Eligible discounts apply instantly.',
                  },
                  {
                    q: 'What is your return or exchange policy?',
                    a: 'Returns or exchanges can be requested within 7 days of delivery. Items must be unused, with tags attached. Begin the process from your Orders page or contact support.',
                  },
                  {
                    q: 'Which payment methods do you support?',
                    a: 'We currently only support bank transfer.',
                  },
                ].map((it, i) => (
                  <details
                    key={i}
                    className="transition-colors group hover:bg-gray-50"
                  >
                    <summary className="flex items-center justify-between px-6 py-4 text-left cursor-pointer">
                      <span className="font-medium">{it.q}</span>
                      <span className="opacity-60">▾</span>
                    </summary>
                    <div
                      className="px-6 pb-5 text-sm"
                      style={{ color: 'rgb(var(--muted))' }}
                    >
                      {it.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white border shadow-sm theme-border rounded-2xl">
              <div className="mb-3 text-lg font-semibold">
                Contact Information
              </div>
              <div
                className="space-y-2 text-sm"
                style={{ color: 'rgb(var(--muted))' }}
              >
                <div>support@theglamstore.ng</div>
                <div>+234 8162113148</div>
                <div>Mon–Fri, 9am–5pm EST</div>
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="p-6 space-y-4 bg-white border shadow-sm theme-border rounded-2xl"
            >
              <div className="text-lg font-semibold">Send us a Message</div>
              <label
                className="block text-xs tracking-wide uppercase"
                style={{ color: 'rgb(var(--muted))' }}
              >
                Name
              </label>
              <Input
                className="w-full"
                value={form.name}
                onChange={(e) =>
                  setForm((v) => ({ ...v, name: e.target.value }))
                }
                required
              />
              <label
                className="block text-xs tracking-wide uppercase"
                style={{ color: 'rgb(var(--muted))' }}
              >
                Email
              </label>
              <Input
                type="email"
                className="w-full"
                value={form.email}
                onChange={(e) =>
                  setForm((v) => ({ ...v, email: e.target.value }))
                }
                required
              />
              <label
                className="block text-xs tracking-wide uppercase"
                style={{ color: 'rgb(var(--muted))' }}
              >
                Subject
              </label>
              <Input
                className="w-full"
                value={form.subject}
                onChange={(e) =>
                  setForm((v) => ({ ...v, subject: e.target.value }))
                }
              />
              <label
                className="block text-xs tracking-wide uppercase"
                style={{ color: 'rgb(var(--muted))' }}
              >
                Message
              </label>
              <textarea
                className="w-full px-3 py-2 bg-white border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                rows={4}
                value={form.message}
                onChange={(e) =>
                  setForm((v) => ({ ...v, message: e.target.value }))
                }
                required
              />
              <button
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-semibold text-white rounded-md btn-primary disabled:opacity-50"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
