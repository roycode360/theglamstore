export function BenefitsBar() {
  return (
    <section className="mx-auto hidden w-full px-2 sm:px-4 md:block">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 md:grid-cols-3 md:divide-x">
          <div className="flex items-center gap-3 px-4 py-4 md:py-6">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-black md:mt-0" />
            <div className="text-left">
              <div className="font-semibold text-zinc-900">
                Delivery available across Nigeria
              </div>
              <div className="text-zinc-500">Fees start as low as ₦2,000</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4 md:py-6">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-black md:mt-0" />
            <div className="text-left">
              <div className="font-semibold text-zinc-900">Support 24/7</div>
              <div className="text-zinc-500">Contact us 24 hours a day</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4 md:py-6">
            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-black md:mt-0" />
            <div className="text-left">
              <div className="font-semibold text-zinc-900">Payment method</div>
              <div className="text-zinc-500">
                Pay Securely via Bank Transfer
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
