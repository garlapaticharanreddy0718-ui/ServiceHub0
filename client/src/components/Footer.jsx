import React from 'react';
import { Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#14221B] border-t border-[#0D1611] py-12 mt-auto text-xs text-[#AEC5B8]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#AEC5B8] text-[#14221B] flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight font-heading">ServiceHub</span>
            </div>
            <p className="text-xs text-[#AEC5B8]/70 max-w-sm leading-relaxed font-sans">
              The modern operations platform for service businesses. Manage appointments, customers, services, and staff seamlessly.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[#AEC5B8] uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-1.5 text-[#AEC5B8]/80 font-medium">
              <li><a href="#services" className="hover:text-white transition-colors">Services Directory</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#experiences" className="hover:text-white transition-colors">Product Preview</a></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[#AEC5B8] uppercase tracking-wider text-[11px]">For Businesses</h4>
            <ul className="space-y-1.5 text-[#AEC5B8]/80 font-medium">
              <li><a href="#for-businesses" className="hover:text-white transition-colors">Salons & Beauty</a></li>
              <li><a href="#for-businesses" className="hover:text-white transition-colors">Clinics & Health</a></li>
              <li><a href="#for-businesses" className="hover:text-white transition-colors">Fitness & Repair</a></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[#AEC5B8] uppercase tracking-wider text-[11px]">Company & Legal</h4>
            <ul className="space-y-1.5 text-[#AEC5B8]/80 font-medium">
              <li><a href="#support" className="hover:text-white transition-colors">Support Center</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#0D1611] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#AEC5B8]/60 font-medium">
          <p>© {new Date().getFullYear()} ServiceHub, Inc. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="#terms" className="hover:text-white transition-colors">Terms</a>
            <a href="#support" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
