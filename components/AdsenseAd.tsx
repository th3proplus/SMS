import React, { useEffect } from 'react';
import { getSettings } from '../services/settingsService';

type AdKey = 'homePageAd' | 'numberPageTopAd' | 'numberPageInFeedAd';

interface AdsenseAdProps {
  adKey: AdKey;
  className?: string;
}

const AdsenseAd: React.FC<AdsenseAdProps> = ({ adKey, className = '' }) => {
  const settings = getSettings();
  const adCode = settings.adsenseEnabled ? settings.ads[adKey] : '';

  useEffect(() => {
    if (adCode) {
      try {
        // After the component mounts with the adCode, we tell AdSense to process it.
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error(`AdSense error for adKey ${adKey}:`, e);
      }
    }
  }, [adCode, adKey]); // Re-run if the ad code changes

  if (!adCode) {
    return (
        <div className="text-center text-xs text-slate-400 dark:text-slate-600 bg-slate-200 dark:bg-slate-800 p-4 rounded-md">
            Ad placeholder - Ad for '{adKey}' is not configured or ads are disabled.
        </div>
    );
  }

  return (
    <div 
      className={`ads-container ${className} flex justify-center items-center min-h-[100px] w-full`}
      dangerouslySetInnerHTML={{ __html: adCode }}
    />
  );
};

export default AdsenseAd;
