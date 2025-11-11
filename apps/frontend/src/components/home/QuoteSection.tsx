export function QuoteSection() {
  return (
    <section className="w-full px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1000px] text-center">
        <p className="text-2xl font-extralight leading-relaxed tracking-wide text-[#494949] md:text-4xl lg:text-2xl">
          "Style is something each of us already has; all we need to do is
          find it. When you wear confidence, everything else looks beautiful."
        </p>
        <div className="mt-7 flex items-center justify-center gap-3 text-xs tracking-widest text-zinc-600">
          <span className="h-px w-10 bg-zinc-300"></span>
          <span>Diane von Fürstenberg</span>
        </div>
      </div>
    </section>
  );
}
