const base = "h-[37px] gap-2 rounded-md px-4 text-sm/[17px] font-semibold [&_svg:not([class*='size-'])]:size-4";

export const primaryButton = `${base} bg-brand-600 text-white hover:bg-brand-700`;
export const outlineButton = `${base} border-ink-300 bg-white text-ink-900 hover:bg-ink-50`;
export const dangerButton = `${base} bg-error text-white hover:bg-error/90`;

export const monoFont = "font-['JetBrains_Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]";

export const rowSwitch =
  "border-0 p-0.5 data-[size=default]:h-5 data-[size=default]:w-9 data-checked:bg-success data-unchecked:bg-ink-300 [&_[data-slot=switch-thumb]]:data-checked:translate-x-4!";
export const largeSwitch =
  "border-0 p-0.5 data-[size=default]:h-[22px] data-[size=default]:w-10 data-checked:bg-success data-unchecked:bg-ink-300 [&_[data-slot=switch-thumb]]:size-[18px]! [&_[data-slot=switch-thumb]]:data-checked:translate-x-[18px]!";

export const fieldBox =
  "h-[42px] rounded-md border-ink-300 bg-white px-3 text-sm/[17px] text-ink-900 shadow-none placeholder:text-ink-500";
export const fieldLabel = "text-[13px]/4 font-semibold text-ink-900";
export const fieldHint = "text-xs/[15px] text-ink-500";
export const fieldError = "text-xs/[15px] text-error";
