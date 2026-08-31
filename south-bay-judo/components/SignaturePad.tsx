"use client";

import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePad({
  onChange,
}: {
  onChange: (dataUrl: string) => void;
}) {
  const padRef = useRef<SignatureCanvas>(null);

  const handleEnd = () => {
    if (padRef.current) {
      onChange(padRef.current.getTrimmedCanvas().toDataURL("image/png"));
    }
  };

  const clear = () => {
    padRef.current?.clear();
    onChange("");
  };

  return (
    <div>
      <div className="border border-ink/25 bg-card rounded-sm">
        <SignatureCanvas
          ref={padRef}
          penColor="#1F2420"
          canvasProps={{ width: 500, height: 140, style: { width: "100%", height: 140 } }}
          onEnd={handleEnd}
        />
      </div>
      <button type="button" onClick={clear} className="text-sm text-ink/60 underline mt-2">
        Clear signature
      </button>
    </div>
  );
}
