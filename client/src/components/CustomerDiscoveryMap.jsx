import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Default center for Hyderabad discovery area if user location unavailable
const HYDERABAD_DEFAULT_CENTER = [17.4399, 78.4483];

// Custom User Location Pin (Blue pulse pin)
const userLocationIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(2, 132, 199, 0.3); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 22px; height: 22px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
        <div style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff;"></div>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Custom Business Pin (Navy standard, Sky blue when selected)
const createBusinessIcon = (isSelected) =>
  L.divIcon({
    className: `custom-business-marker-${isSelected ? 'selected' : 'default'}`,
    html: `
      <div style="position: relative; cursor: pointer; transform: scale(${isSelected ? 1.25 : 1}); transition: transform 0.2s ease;">
        <div style="background: ${isSelected ? '#0284c7' : '#0f172a'}; color: #ffffff; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
          <svg style="transform: rotate(45deg); width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });

// Controller component to smoothly pan/zoom map on selection or location change
function MapController({ selectedCoords, userCoords, centerCoords }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCoords && selectedCoords[0] && selectedCoords[1]) {
      map.setView(selectedCoords, 14, { animate: true });
    } else if (userCoords && userCoords[0] && userCoords[1]) {
      map.setView(userCoords, 13, { animate: true });
    } else if (centerCoords && centerCoords[0] && centerCoords[1]) {
      map.setView(centerCoords, 12, { animate: true });
    }
  }, [map, selectedCoords, userCoords, centerCoords]);

  return null;
}

export default function CustomerDiscoveryMap({
  userCoords,
  businesses = [],
  selectedBizId,
  onSelectBusiness,
  onViewServices,
}) {
  const markerRefs = useRef({});

  // Filter businesses that have valid coordinates
  const validBusinesses = businesses.filter(
    (b) => b.latitude !== null && b.longitude !== null && !isNaN(Number(b.latitude)) && !isNaN(Number(b.longitude))
  );

  // Compute active user coords
  const hasUserCoords =
    userCoords &&
    userCoords.lat !== null &&
    userCoords.lng !== null &&
    !isNaN(Number(userCoords.lat)) &&
    !isNaN(Number(userCoords.lng));

  const userPos = hasUserCoords ? [Number(userCoords.lat), Number(userCoords.lng)] : null;

  // Selected business coords
  const selectedBiz = validBusinesses.find((b) => b.id === selectedBizId);
  const selectedPos = selectedBiz ? [Number(selectedBiz.latitude), Number(selectedBiz.longitude)] : null;

  // Default map center
  const initialCenter = userPos
    ? userPos
    : validBusinesses.length > 0
    ? [Number(validBusinesses[0].latitude), Number(validBusinesses[0].longitude)]
    : HYDERABAD_DEFAULT_CENTER;

  // Open marker popup when selectedBizId changes
  useEffect(() => {
    if (selectedBizId && markerRefs.current[selectedBizId]) {
      markerRefs.current[selectedBizId].openPopup();
    }
  }, [selectedBizId]);

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs relative bg-slate-100 flex flex-col">
      <MapContainer
        center={initialCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full flex-1 z-10"
        style={{ minHeight: '420px', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          selectedCoords={selectedPos}
          userCoords={userPos}
          centerCoords={initialCenter}
        />

        {/* Customer Location Marker */}
        {hasUserCoords && (
          <Marker position={userPos} icon={userLocationIcon}>
            <Popup className="custom-popup">
              <div className="p-1 space-y-1 text-xs">
                <span className="font-extrabold text-sky-600 block">Your Location</span>
                <span className="text-[11px] text-slate-500 block">Active Search Origin</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Business Location Markers */}
        {validBusinesses.map((b) => {
          const isSelected = b.id === selectedBizId;
          const pos = [Number(b.latitude), Number(b.longitude)];

          return (
            <Marker
              key={b.id}
              position={pos}
              icon={createBusinessIcon(isSelected)}
              ref={(ref) => {
                if (ref) markerRefs.current[b.id] = ref;
              }}
              eventHandlers={{
                click: () => onSelectBusiness && onSelectBusiness(b),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-2 space-y-2 max-w-xs font-sans">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 font-mono bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        {b.category || 'Service Business'}
                      </span>
                      {b.distanceKm !== null && (
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          📍 {b.distanceKm} km
                        </span>
                      )}
                    </div>
                    <strong className="text-sm font-extrabold text-slate-900 block leading-tight">
                      {b.name}
                    </strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {b.address || b.city || 'Hyderabad'}
                    </span>
                  </div>

                  {b.services && b.services.length > 0 && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] space-y-1">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        POPULAR SERVICES
                      </span>
                      <div className="space-y-0.5">
                        {b.services.slice(0, 3).map((s) => (
                          <div key={s.id} className="flex justify-between items-center text-slate-700">
                            <span className="truncate font-medium">{s.name}</span>
                            <span className="font-mono font-bold text-emerald-700 ml-2">
                              ₹{Number(s.price).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewServices && onViewServices(b);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors text-center block shadow-2xs"
                  >
                    View Services →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
