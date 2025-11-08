import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1000px]">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Effective date: {new Date().getFullYear()}
          </p>
        </header>

        <div
          className="space-y-8 text-sm leading-6"
          style={{ color: 'rgb(var(--muted))' }}
        >
          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using TheGlamStore (the “Service”), you agree to
              be bound by these Terms. If you do not agree, do not use the
              Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              2. Accounts
            </h2>
            <p>
              You must provide accurate information and keep your account
              secure. You are responsible for all activity under your account.
              Notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              3. Orders, Pricing & Availability
            </h2>
            <p>
              All orders are subject to acceptance and availability. We may
              refuse or cancel an order for reasons including product
              availability, errors in pricing or product information, or
              suspected fraud. Prices are displayed in your selected currency
              and may change without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              4. Shipping, Returns & Refunds
            </h2>
            <p>
              Shipping times are estimates and may vary. Please see our returns
              policy for eligibility, timelines and non‑returnable items.
              Refunds are issued to the original payment method once items are
              received and inspected.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              5. Payments
            </h2>
            <p>
              We use secure third‑party processors. By submitting a payment, you
              represent you are authorized to use the selected method and
              authorize us to charge the order total, including taxes, fees and
              shipping.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              6. Prohibited Uses
            </h2>
            <ul className="list-inside list-disc space-y-1">
              <li>Illegal, infringing or fraudulent activity.</li>
              <li>
                Interfering with the security or operation of the Service.
              </li>
              <li>Copying or scraping content except as permitted by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              7. Intellectual Property
            </h2>
            <p>
              All content and trademarks on the Service are owned by or licensed
              to us and are protected by law. You may not use them without prior
              written permission.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              8. Disclaimers & Liability
            </h2>
            <p>
              The Service is provided “as is”. To the fullest extent permitted
              by law, we disclaim all warranties and will not be liable for any
              indirect, incidental or consequential damages arising from your
              use of the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              9. Privacy
            </h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link to="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              10. Changes
            </h2>
            <p>
              We may update these Terms from time to time. Continued use of the
              Service constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-black">
              11. Contact
            </h2>
            <p>
              Questions about these Terms? Visit{' '}
              <Link to="/customer-service" className="underline">
                Customer Service
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
