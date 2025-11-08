import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1000px]">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Effective date: {new Date().getFullYear()}
          </p>
        </header>

        <div className="space-y-8 text-sm leading-6" style={{ color: 'rgb(var(--muted))' }}>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">1. Overview</h2>
            <p>
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you visit or make a purchase at TheGlamStore (the “Service”). By
              using the Service, you agree to the collection and use of information in accordance
              with this policy.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">2. Information We Collect</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <span className="font-medium text-black">Account & Profile:</span> name, email,
                delivery addresses, and preferences you add to your account.
              </li>
              <li>
                <span className="font-medium text-black">Orders & Payments:</span> order details,
                totals and status. We do not store full payment card numbers; payments are processed
                securely by our payment partners.
              </li>
              <li>
                <span className="font-medium text-black">Usage & Device:</span> log data, IP
                address, browser type, pages visited, and cookies for analytics and performance.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">3. How We Use Information</h2>
            <ul className="list-inside list-disc space-y-1">
              <li>To provide and improve ordering, delivery and customer support.</li>
              <li>To personalize content, recommendations and communications.</li>
              <li>To detect fraud, secure our platform and comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">4. Cookies & Tracking</h2>
            <p>
              We use first‑party cookies for session management and analytics. You can control
              cookies via your browser settings; disabling some cookies may impact site
              functionality.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">5. Sharing Your Information</h2>
            <p>
              We share data with service providers who perform functions on our behalf (e.g.,
              payment processors, shipping carriers, analytics). These providers are obligated to
              protect your information and use it only for the services we request. We may also
              disclose data where required by law or to protect our rights.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">6. Data Retention</h2>
            <p>
              We retain information for as long as needed to provide the Service, fulfill orders,
              comply with our legal obligations and resolve disputes. When no longer required, we
              securely delete or anonymize data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">7. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete or port
              your personal data, and to object to or restrict certain processing. To exercise a
              right, please contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">8. Children’s Privacy</h2>
            <p>
              Our Service is not directed to children under 13 and we do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">9. Changes to This Policy</h2>
            <p>
              We may update this Policy to reflect changes to our practices or for legal reasons.
              We will post the updated version with a new “Effective date”.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">10. Contact Us</h2>
            <p>
              Questions? Contact us at <Link to="/customer-service" className="underline">Customer Service</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


