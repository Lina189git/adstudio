export type PaintingStylePreset = "monet" | "cezanne" | "ukiyoe" | "vangogh";
export type PaintingProductMode = "download" | "print";
export type CanvasSize = "8x10" | "12x16" | "18x24" | "24x36";
export type FrameStyle = "none" | "black_wood" | "walnut" | "gold_gallery";

export type PaintingStyleOption = {
  value: PaintingStylePreset;
  label: string;
  description: string;
};

export const PAINTING_STYLE_OPTIONS: PaintingStyleOption[] = [
  {
    value: "monet",
    label: "Monet Glow",
    description: "Soft brushwork, atmospheric light, and a warm gallery finish.",
  },
  {
    value: "cezanne",
    label: "Cezanne Structure",
    description: "Balanced forms, painterly depth, and a composed studio look.",
  },
  {
    value: "ukiyoe",
    label: "Ukiyo-e Detail",
    description: "Stronger contours, flatter color blocks, and a graphic fine-art feel.",
  },
  {
    value: "vangogh",
    label: "Van Gogh Motion",
    description: "Expressive strokes, richer contrast, and a more dramatic canvas texture.",
  },
];

export const DEFAULT_PAINTING_STYLE: PaintingStylePreset =
  PAINTING_STYLE_OPTIONS[0].value;

export const CANVAS_SIZE_OPTIONS: {
  value: CanvasSize;
  label: string;
  basePrice: number;
}[] = [
  { value: "8x10", label: '8" x 10"', basePrice: 69 },
  { value: "12x16", label: '12" x 16"', basePrice: 99 },
  { value: "18x24", label: '18" x 24"', basePrice: 149 },
  { value: "24x36", label: '24" x 36"', basePrice: 229 },
];

export const FRAME_STYLE_OPTIONS: {
  value: FrameStyle;
  label: string;
  surcharge: number;
}[] = [
  { value: "none", label: "No frame", surcharge: 0 },
  { value: "black_wood", label: "Black wood", surcharge: 25 },
  { value: "walnut", label: "Walnut", surcharge: 35 },
  { value: "gold_gallery", label: "Gold gallery", surcharge: 45 },
];

export function getCanvasSizeLabel(value?: string | null) {
  return (
    CANVAS_SIZE_OPTIONS.find((option) => option.value === value)?.label || value || "Custom size"
  );
}

export function getFrameStyleLabel(value?: string | null) {
  return (
    FRAME_STYLE_OPTIONS.find((option) => option.value === value)?.label ||
    value?.replace(/_/g, " ") ||
    "Custom frame"
  );
}

export function normalizePaintingStylePreset(
  value?: string | null
): PaintingStylePreset {
  return (
    PAINTING_STYLE_OPTIONS.find((option) => option.value === value)?.value ||
    DEFAULT_PAINTING_STYLE
  );
}

export function getPaintingStyleLabel(value?: string | null) {
  return (
    PAINTING_STYLE_OPTIONS.find((option) => option.value === value)?.label ||
    "Custom oil painting"
  );
}

export function getPaintingTransformations(style: PaintingStylePreset) {
  const common = [
    { fetch_format: "auto", quality: "auto" },
    { crop: "limit", width: 1600, height: 1600 },
  ];

  switch (style) {
    case "cezanne":
      return [
        ...common,
        { effect: "art:incognito" },
        { effect: "contrast:18" },
        { effect: "saturation:5" },
        { effect: "sharpen:55" },
      ];
    case "ukiyoe":
      return [
        ...common,
        { effect: "art:red_rock" },
        { effect: "saturation:12" },
        { effect: "outline:14" },
        { effect: "sharpen:45" },
      ];
    case "vangogh":
      return [
        ...common,
        { effect: "art:zorro" },
        { effect: "vibrance:35" },
        { effect: "contrast:28" },
        { effect: "sharpen:90" },
      ];
    case "monet":
    default:
      return [
        ...common,
        { effect: "art:aurora" },
        { effect: "saturation:-4" },
        { effect: "contrast:12" },
        { effect: "sharpen:50" },
      ];
  }
}

export function estimatePaintingPrice(input: {
  mode: PaintingProductMode;
  canvasSize?: CanvasSize;
  frameStyle?: FrameStyle;
  quantity?: number;
}) {
  const quantity = Math.max(input.quantity || 1, 1);

  if (input.mode === "download") {
    return {
      unitAmount: 2900,
      label: "Digital oil-paint file",
      total: 29 * quantity,
    };
  }

  const canvas = CANVAS_SIZE_OPTIONS.find(
    (option) => option.value === input.canvasSize
  );
  const frame = FRAME_STYLE_OPTIONS.find(
    (option) => option.value === input.frameStyle
  );

  const basePrice = (canvas?.basePrice || 99) + (frame?.surcharge || 0);

  return {
    unitAmount: basePrice * 100,
    label: `Canvas print ${input.canvasSize || '12x16'}${frame?.label ? ` / ${frame.label}` : ""}`,
    total: basePrice * quantity,
  };
}
