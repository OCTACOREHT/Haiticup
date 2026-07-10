"use client";

import React from "react";

export default function SubstitutionCardsPage() {
  const cards = Array(8).fill(null);

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="no-print p-4 bg-gray-100 flex justify-center items-center shadow-md mb-8 sticky top-0 z-50">
        <button 
          onClick={() => window.print()}
          className="px-8 py-3 bg-[#004AD3] text-white font-bold rounded-lg shadow-lg hover:bg-[#0038a8] transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print Substitution Cards
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:w-full print:m-0">
        <div className="grid grid-cols-2 grid-rows-4 gap-4 print:gap-[4mm]">
          {cards.map((_, i) => (
            <div 
              key={i} 
              className="border-2 border-dashed border-gray-400 p-4 print:p-[4mm] flex flex-col justify-between break-inside-avoid"
              style={{ minHeight: "65mm" }}
            >
              {/* Header */}
              <div className="flex justify-center items-center mb-4 relative">
                <h1 className="font-bold text-[15px] sm:text-lg tracking-wide">SUBSTITUTION CARD</h1>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-12 sm:h-12 sm:w-16">
                  <img src="/Granpanpan%20Nation%20cupfull.png" alt="Granpan Nations Cup Logo" className="object-contain w-full h-full" />
                </div>
              </div>

              {/* Form Fields */}
              <div className="flex-1 space-y-4 text-xs sm:text-sm font-semibold">
                <div className="flex items-end">
                  <span className="mr-2 whitespace-nowrap">TEAM</span>
                  <div className="border-b-[1.5px] border-black flex-1"></div>
                </div>

                <div className="flex items-end">
                  <span className="mr-2 whitespace-nowrap">PLAYER IN</span>
                  <div className="border-b-[1.5px] border-black flex-[3]"></div>
                  <span className="mx-2">#</span>
                  <div className="border-b-[1.5px] border-black flex-[1]"></div>
                </div>

                <div className="flex items-end">
                  <span className="mr-2 whitespace-nowrap">PLAYER OUT</span>
                  <div className="border-b-[1.5px] border-black flex-[3]"></div>
                  <span className="mx-2">#</span>
                  <div className="border-b-[1.5px] border-black flex-[1]"></div>
                </div>

                <div className="flex items-end">
                  <span className="mr-2 whitespace-nowrap">COACH</span>
                  <div className="border-b-[1.5px] border-black flex-1"></div>
                </div>

                <div className="flex items-end">
                  <span className="mr-2 whitespace-nowrap">REFEREE</span>
                  <div className="border-b-[1.5px] border-black flex-1"></div>
                </div>

                <div className="flex items-end">
                  <span className="mr-2 whitespace-nowrap">DATE</span>
                  <div className="border-b-[1.5px] border-black flex-[2]"></div>
                  <span className="mx-2 whitespace-nowrap">SUBSTITUTION MINUTE</span>
                  <div className="border-b-[1.5px] border-black flex-[1]"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
