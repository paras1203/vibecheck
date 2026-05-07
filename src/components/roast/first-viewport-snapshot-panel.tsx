"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconFrame } from "@/components/ui/icon-frame";
import { ImageIcon } from "lucide-react";
import { heroScreenshotDataUrl } from "@/lib/hero-image";

type Props = {
  heroBase64?: string;
  siteLabel?: string;
};

/** First chunk / above-the-fold screenshot only (same asset as exports). */
export function FirstViewportSnapshotPanel({ heroBase64, siteLabel }: Props) {
  const dataUrl = heroScreenshotDataUrl(heroBase64);
  const heroPresent = Boolean(heroBase64?.trim());
  const invalidHero = heroPresent && dataUrl === null;
  const [imageFailed, setImageFailed] = useState(false);
  const onImgError = useCallback(() => setImageFailed(true), []);

  useEffect(() => {
    setImageFailed(false);
  }, [heroBase64, dataUrl]);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <IconFrame size="sm" className="bg-muted text-foreground">
            <ImageIcon className="size-4 stroke-[1.5]" />
          </IconFrame>
          First viewport snapshot
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Single above-the-fold capture from the audited URL—same frame used in exports.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex w-full min-w-0 justify-center">
          <div className="relative isolate w-full min-h-[12rem] min-w-0 max-w-full overflow-x-auto overflow-y-visible rounded-lg border border-border bg-[#0f172a]">
            {dataUrl && !imageFailed ? (
              <img
                src={dataUrl}
                alt=""
                className="relative z-0 mx-auto block h-auto max-h-none min-w-0 w-auto max-w-none object-contain object-top"
                decoding="async"
                onError={onImgError}
              />
            ) : dataUrl && imageFailed ? (
              <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Screenshot could not be displayed. Re-run the roast to refresh the capture.
                </p>
                {siteLabel ? (
                  <p className="font-mono text-xs text-foreground/80">{siteLabel}</p>
                ) : null}
              </div>
            ) : invalidHero ? (
              <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Screenshot data is unreadable or incomplete. Try a fresh roast—the capture may have been clipped or corrupted in storage.
                </p>
                {siteLabel ? (
                  <p className="font-mono text-xs text-foreground/80">{siteLabel}</p>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-[12rem] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No screenshot stored for this report. Run a new roast to attach the first-viewport capture.
                </p>
                {siteLabel ? (
                  <p className="font-mono text-xs text-foreground/80">{siteLabel}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
