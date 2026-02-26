"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
          relayout: () => void;
        };
        Marker: new (options: { map: unknown; position: unknown }) => void;
        services: {
          Geocoder: new () => {
            addressSearch: (
              address: string,
              callback: (result: { x: string; y: string }[], status: string) => void,
            ) => void;
          };
          Status: { OK: string };
        };
      };
    };
  }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";

interface KakaoMapProps {
  address: string;
}

export function KakaoMap({ address }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!KAKAO_JS_KEY || !address) {
      setError(true);
      return;
    }

    function initMap() {
      window.kakao.maps.load(() => {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (status !== window.kakao.maps.services.Status.OK || !result[0]) {
            setError(true);
            return;
          }
          if (!mapRef.current) return;

          const coords = new window.kakao.maps.LatLng(
            parseFloat(result[0].y),
            parseFloat(result[0].x),
          );
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: coords,
            level: 3,
          });
          new window.kakao.maps.Marker({ map, position: coords });
          setTimeout(() => map.relayout(), 100);
        });
      });
    }

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    const existing = document.getElementById("kakao-maps-script");
    if (existing) {
      existing.addEventListener("load", initMap);
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-script";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = initMap;
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
