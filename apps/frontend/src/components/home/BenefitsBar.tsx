export function BenefitsBar() {
  return (
    <section className="hidden w-full px-2 mx-auto sm:px-4 md:block">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 text-sm bg-white border rounded-lg border-zinc-200 text-zinc-700 md:grid-cols-3 md:divide-x">
          <div className="flex items-center gap-3 px-4 py-4 md:py-6">
            <span className="inline-block w-2 h-2 mt-1 bg-black rounded-full md:mt-0" />
            <div className="text-left">
              <div className="font-semibold text-zinc-900">
                Delivery available across Nigeria
              </div>
              <div className="text-zinc-500">Fees start as low as ₦3,000</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4 md:py-6">
            <span className="inline-block w-2 h-2 mt-1 bg-black rounded-full md:mt-0" />
            <div className="text-left">
              <div className="font-semibold text-zinc-900">Support 24/7</div>
              <div className="text-zinc-500">Contact us 24 hours a day</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-4 md:py-6">
            <span className="inline-block w-2 h-2 mt-1 bg-black rounded-full md:mt-0" />
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
