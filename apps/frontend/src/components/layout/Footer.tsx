import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="my-16 border-t bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'rgb(var(--brand-200))',
                color: 'rgb(var(--brand-800))',
              }}
            >
              👜
            </span>
            <span className="font-semibold">TheGlamStore</span>
          </div>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Discover the finest fashion pieces curated for the modern lifestyle.
            Quality craftsmanship meets contemporary design.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold">Quick Links</div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/products">Products</Link>
            </li>
            <li>
              <Link to="/categories">Categories</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold">Support</div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/customer-service">Customer Service</Link>
            </li>
            {/* <li>
              <a href="#">Size Guide</a>
            </li> */}
            {/* <li>
              <a href="#">Returns</a>
            </li> */}
          </ul>
        </div>
      </div>
      <div
        className="mx-auto mt-7 max-w-7xl px-4 pb-10 text-center text-xs sm:px-6"
        style={{ color: 'rgb(var(--muted))' }}
      >
        © 2025 TheGlamStore. All rights reserved.
      </div>
    </footer>
  );
};
