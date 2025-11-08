import { Link } from 'react-router-dom';
import { brandLogo } from 'src/assets/images';

export const Footer = () => {
  return (
    <footer className="py-16 bg-white border-t">
      <div className="grid grid-cols-1 gap-8 px-4 py-10 mx-auto max-w-7xl sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img src={brandLogo} alt="TheGlamStore" className="w-52" />
          </div>
          <p className="mt-5 text-sm" style={{ color: 'rgb(var(--muted))' }}>
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
            <li>
              <Link to="/terms-of-service">Terms of Service</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Privacy Policy</Link>
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
        className="px-4 pb-10 mx-auto text-xs text-center mt-7 max-w-7xl sm:px-6"
        style={{ color: 'rgb(var(--muted))' }}
      >
        © 2025 TheGlamStore. All rights reserved.
      </div>
    </footer>
  );
};
