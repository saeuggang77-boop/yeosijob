"use client";

import { useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

interface GoogleMapProps {
  address: string;
}

export function GoogleMap({ address }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !address) {
      setError(true);
      return;
    }

    function initMap() {
      if (!mapRef.current || !window.google?.maps) return;

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status !== "OK" || !results?.[0]) {
          setError(true);
          return;
        }
        if (!mapRef.current) return;

        const location = results[0].geometry.location;
        const map = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
        });
        new window.google.maps.Marker({ map, position: location });
      });
    }

    if (window.google?.maps) {
      initMap();
      return;
    }

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", initMap);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`;
    script.async = true;
    script.onload = initMap;
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, [address]);

  if (error) return null;

  return (
    <div
      ref={mapRef}
      className="mt-3 h-[200px] w-full overflow-hidden rounded-md border"
    />
  );
}
