import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * Minimal JSX typing for the `<model-viewer>` custom element from
 * @google/model-viewer. The element is registered client-side only (see
 * PlaneOutro.tsx); this file only teaches the compiler the tag and the
 * attributes this project actually uses.
 */
type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  alt?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "interaction" | "manual";
  "camera-orbit"?: string;
  "camera-target"?: string;
  "field-of-view"?: string;
  exposure?: string | number;
  "shadow-intensity"?: string | number;
  "shadow-softness"?: string | number;
  "environment-image"?: string;
  "disable-zoom"?: boolean;
  "interaction-prompt"?: "auto" | "none" | "when-focused";
};

// React 19's @types/react no longer puts the JSX namespace on the true
// global scope — it lives inside the "react" module itself, so the custom
// element has to be registered there rather than via `declare global`.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

/**
 * One entry of the loaded model's scene-graph material list
 * (`<model-viewer>.model.materials`), scoped to the single call this project
 * makes: recolouring the body paint via the PBR base colour factor.
 */
export interface ModelViewerMaterial {
  name: string;
  pbrMetallicRoughness: {
    setBaseColorFactor: (rgba: [number, number, number, number]) => void;
  };
}

/**
 * The subset of the custom element's imperative DOM interface this project
 * drives from GSAP's ScrollTrigger onUpdate, plus the bits of the Model API
 * used once on load to recolour the body paint material.
 */
export type ModelViewerElement = HTMLElement & {
  cameraOrbit: string;
  cameraTarget?: string;
  fieldOfView?: string;
  /** True once the GLB has finished loading and `.model` is populated. */
  loaded?: boolean;
  model?: {
    materials: ModelViewerMaterial[];
  };
};

export {};
