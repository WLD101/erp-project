"use client";

interface WatermarkProps {
    text?: string;
}

export default function Watermark({ text = "CONFIDENTIAL" }: WatermarkProps) {
    return (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
            <div className="rotate-[-45deg] opacity-10 text-[8rem] font-bold text-slate-900 whitespace-nowrap select-none">
                {text}
            </div>
        </div>
    );
}
