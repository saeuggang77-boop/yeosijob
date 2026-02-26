'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function PushSubscriptionManager() {
  const { data: session, status } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // 로그인하지 않았으면 아무것도 하지 않음
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    // Push API 지원 확인
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported');
      return;
    }

    setIsSupported(true);

    // Service Worker 등록 및 Push 구독
    async function setupPush() {
      try {
        // Service Worker 등록
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // 이미 구독되어 있는지 확인
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
          setIsSubscribed(true);
          return;
        }

        // 알림 권한 요청
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return;
        }

        // VAPID public key
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          console.error('VAPID public key not found');
          return;
        }

        // Push 구독
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });

        // 서버에 구독 정보 저장
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
              auth: arrayBufferToBase64(subscription.getKey('auth')),
            },
          }),
        });

        if (response.ok) {
          setIsSubscribed(true);
          console.log('Push subscription successful');
        } else {
          console.error('Failed to save push subscription');
        }
      } catch (error) {
        console.error('Push subscription error:', error);
      }
    }

    setupPush();
  }, [session, status]);

  return null; // UI 없음, 백그라운드에서 동작
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
