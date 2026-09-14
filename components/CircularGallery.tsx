'use client';

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { useEffect, useRef } from 'react';

import './CircularGallery.css';

type GL = Renderer['gl'];

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: number;
  return function (this: any, ...args: Parameters<T>) {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: any): void {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key !== 'constructor' && typeof instance[key] === 'function') {
      instance[key] = instance[key].bind(instance);
    }
  });
}

const DEFAULT_FONT = 'bold 30px Figtree';
// Figtree is not guaranteed to be available on the host page, so the component
// loads it on demand whenever the default font is used.
const DEFAULT_FONT_URL = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&display=swap';

function deriveFontFamilyFromUrl(url: string): string {
  const fileName = (url.split('/').pop() || 'custom-font').split('?')[0];
  const base = fileName.replace(/\.(woff2?|ttf|otf|eot)$/i, '');
  return base.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'CircularGalleryFont';
}

async function loadFontFromStylesheet(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font stylesheet (${response.status})`);
  const cssText = await response.text();
  const faceBlocks = cssText.match(/@font-face\s*{[^}]*}/g) || [];
  let family: string | null = null;
  const fontFaces: FontFace[] = [];
  for (const block of faceBlocks) {
    const familyMatch = block.match(/font-family:\s*['"]?([^;'"]+)['"]?/);
    const urlMatch = block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    if (!familyMatch || !urlMatch) continue;
    family = familyMatch[1].trim();
    const descriptors: FontFaceDescriptors = {};
    const weightMatch = block.match(/font-weight:\s*([^;]+);/);
    const styleMatch = block.match(/font-style:\s*([^;]+);/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);
    if (weightMatch) descriptors.weight = weightMatch[1].trim();
    if (styleMatch) descriptors.style = styleMatch[1].trim();
    if (rangeMatch) descriptors.unicodeRange = rangeMatch[1].trim();
    fontFaces.push(new FontFace(family, `url(${urlMatch[1]})`, descriptors));
  }
  if (!family) throw new Error('No @font-face rule found in the stylesheet');
  await Promise.allSettled(
    fontFaces.map(async face => {
      await face.load();
      document.fonts.add(face);
    })
  );
  return family;
}

async function loadFontFromFile(url: string): Promise<string> {
  const family = deriveFontFamilyFromUrl(url);
  const fontFace = new FontFace(family, `url(${url})`);
  await fontFace.load();
  document.fonts.add(fontFace);
  return family;
}

async function loadCustomFont(fontUrl: string): Promise<string> {
  const isStylesheet = fontUrl.includes('fonts.googleapis.com') || /\.css(\?.*)?$/i.test(fontUrl);
  return isStylesheet ? loadFontFromStylesheet(fontUrl) : loadFontFromFile(fontUrl);
}

// Loads `fontUrl` (a stylesheet such as a Google Fonts URL, or a direct font
// file) and returns a canvas-ready font string that keeps the size/weight from
// `font` but swaps in the freshly loaded family. Falls back to `font` on error.
async function resolveFont(font: string, fontUrl?: string): Promise<string> {
  // Use the bundled Figtree stylesheet when the caller relies on the default
  // font, otherwise honor the explicit `fontUrl`.
  const effectiveUrl = fontUrl || (font === DEFAULT_FONT ? DEFAULT_FONT_URL : null);
  if (!effectiveUrl) {
    // A custom family was supplied without a URL – make sure it is ready (in
    // case the host page declares it) before we draw it to the canvas,
    // otherwise the first paint silently falls back to a system font.
    if (document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(font);
        await document.fonts.ready;
      } catch {
        // Ignore – fall back to whatever the browser provides.
      }
    }
    return font;
  }
  try {
    const family = await loadCustomFont(effectiveUrl);
    const sizeMatch = font.match(/^\s*(.*?\d+px)/);
    const prefix = sizeMatch ? sizeMatch[1].trim() : 'bold 30px';
    const resolved = `${prefix} "${family}"`;
    if (document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(resolved);
      } catch {
        // Ignore – we still attempt to render with the requested font.
      }
    }
    return resolved;
  } catch (error) {
    console.error('CircularGallery: unable to load font from', fontUrl, error);
    return font;
  }
}

function getFontSize(font: string): number {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}

function createTextTexture(
  gl: GL,
  text: string,
  font: string = 'bold 30px monospace',
  color: string = 'black'
): { texture: Texture; width: number; height: number } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2d context');

  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const fontSize = getFontSize(font);
  const textHeight = Math.ceil(fontSize * 1.2);

  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;

  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

interface TitleProps {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor?: string;
  font?: string;
}

class Title {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor: string;
  font: string;
  mesh!: Mesh;

  constructor({ gl, plane, renderer, text, textColor = '#545050', font = '30px sans-serif' }: TitleProps) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeightScaled = this.plane.scale.y * 0.15;
    const textWidthScaled = textHeightScaled * aspect;
    this.mesh.scale.set(textWidthScaled, textHeightScaled, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }
}

interface ScreenSize {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

interface MediaProps {
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius?: number;
  font?: string;
}

class Media {
  extra: number = 0;
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius: number;
  font?: string;
  program!: Program;
  plane!: Mesh;
  title!: Title;
  scale!: number;
  padding!: number;
  width!: number;
  widthTotal!: number;
  x!: number;
  speed: number = 0;
  isBefore: boolean = false;
  isAfter: boolean = false;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0,
    font
  }: MediaProps) {
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);

          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);

          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);

          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program
    });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font
    });
  }

  update(scroll: { current: number; last: number }, direction: 'right' | 'left') {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({ screen, viewport }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

interface AppConfig {
  items?: { image: string; text: string }[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  /** Attach window-level wheel/mousewheel listeners. Default true. */
  captureWheel?: boolean;
  /** Attach pointer (drag) listeners, scoped to the container. Default true. */
  capturePointer?: boolean;
  /** Device pixel ratio cap for the renderer. Upstream default is 2. */
  dpr?: number;
}

class App {
  container: HTMLElement;
  scrollSpeed: number;
  captureWheel: boolean;
  capturePointer: boolean;
  dpr?: number;
  scroll: {
    ease: number;
    current: number;
    target: number;
    last: number;
    position?: number;
  };
  /** Written by the host via setScrollBase(). Never touched by user input. */
  scrollBase: number = 0;
  /** Accumulated by wheel/keyboard/pointer drag. Never touched by the host. */
  dragOffset: number = 0;
  onCheckDebounce: (...args: any[]) => void;
  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Plane;
  medias: Media[] = [];
  mediasImages: { image: string; text: string }[] = [];
  screen!: { width: number; height: number };
  viewport!: { width: number; height: number };
  raf: number = 0;

  boundOnResize!: () => void;
  boundOnWheel!: (e: Event) => void;
  boundOnPointerDown!: (e: PointerEvent) => void;
  boundOnPointerMove!: (e: PointerEvent) => void;
  boundOnPointerUp!: (e: PointerEvent) => void;
  boundOnPointerCancel!: (e: PointerEvent) => void;
  boundOnLostPointerCapture!: (e: PointerEvent) => void;
  boundOnKeyDown!: (e: KeyboardEvent) => void;

  isDown: boolean = false;
  /** The pointer currently being tracked (mouse press, or a touch that has
   *  proven horizontal). Null when nothing is being tracked. */
  activePointerId: number | null = null;
  /** True once a touch gesture has been claimed as a horizontal drag (mouse
   *  presses resolve immediately). Until then, movement is only measured. */
  gestureResolved: boolean = false;
  isTouchPointer: boolean = false;
  pointerStartX: number = 0;
  pointerStartY: number = 0;
  dragStartOffset: number = 0;

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 1,
      textColor = '#ffffff',
      borderRadius = 0,
      font = 'bold 30px Figtree',
      scrollSpeed = 2,
      scrollEase = 0.05,
      captureWheel = true,
      capturePointer = true,
      dpr
    }: AppConfig
  ) {
    document.documentElement.classList.remove('no-js');
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.captureWheel = captureWheel;
    this.capturePointer = capturePointer;
    this.dpr = dpr;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, this.dpr ?? 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100
    });
  }

  createMedias(
    items: { image: string; text: string }[] | undefined,
    bend: number = 1,
    textColor: string,
    borderRadius: number,
    font: string
  ) {
    const defaultItems = [
      {
        image: `https://picsum.photos/seed/1/800/600?grayscale`,
        text: 'Bridge'
      },
      {
        image: `https://picsum.photos/seed/2/800/600?grayscale`,
        text: 'Desk Setup'
      },
      {
        image: `https://picsum.photos/seed/3/800/600?grayscale`,
        text: 'Waterfall'
      },
      {
        image: `https://picsum.photos/seed/4/800/600?grayscale`,
        text: 'Strawberries'
      },
      {
        image: `https://picsum.photos/seed/5/800/600?grayscale`,
        text: 'Deep Diving'
      },
      {
        image: `https://picsum.photos/seed/16/800/600?grayscale`,
        text: 'Train Track'
      },
      {
        image: `https://picsum.photos/seed/17/800/600?grayscale`,
        text: 'Santorini'
      },
      {
        image: `https://picsum.photos/seed/8/800/600?grayscale`,
        text: 'Blurry Lights'
      },
      {
        image: `https://picsum.photos/seed/9/800/600?grayscale`,
        text: 'New York'
      },
      {
        image: `https://picsum.photos/seed/10/800/600?grayscale`,
        text: 'Good Boy'
      },
      {
        image: `https://picsum.photos/seed/21/800/600?grayscale`,
        text: 'Coastline'
      },
      {
        image: `https://picsum.photos/seed/12/800/600?grayscale`,
        text: 'Palm Trees'
      }
    ];
    const galleryItems = items && items.length ? items : defaultItems;
    // Was `galleryItems.concat(galleryItems)` — doubling the list (6 items
    // -> 12 planes) so the wrap-around recycling had more distance to work
    // with. The site only ever passes 6 curated cards now, and doubling
    // them made the carousel read as showing more than 6/duplicated cards.
    // The wrap-around math (Media.update()'s isBefore/isAfter recycling)
    // doesn't require the extra copies — it recycles a plane by shifting it
    // by the full track width regardless of how many items that track has.
    this.mediasImages = galleryItems;
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font
      });
    });
  }

  /** target = scrollBase + dragOffset. The host writes scrollBase only; user
   *  input (wheel, keyboard, drag) writes dragOffset only, so a live scroll
   *  update can never cancel a drag in progress. */
  applyTarget() {
    this.scroll.target = this.scrollBase + this.dragOffset;
  }

  onPointerDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.activePointerId = e.pointerId;
    this.isTouchPointer = e.pointerType === 'touch';
    this.pointerStartX = e.clientX;
    this.pointerStartY = e.clientY;
    this.dragStartOffset = this.dragOffset;

    if (this.isTouchPointer) {
      // Not claimed yet — wait to see whether the gesture is horizontal so a
      // vertical touch can still scroll the page.
      this.gestureResolved = false;
      this.isDown = false;
    } else {
      this.gestureResolved = true;
      this.isDown = true;
      this.capturePointerId(e);
    }
  }

  onPointerMove(e: PointerEvent) {
    if (this.activePointerId === null || e.pointerId !== this.activePointerId) return;

    const dx = e.clientX - this.pointerStartX;
    const dy = e.clientY - this.pointerStartY;

    if (!this.gestureResolved) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.gestureResolved = true;
        this.isDown = true;
        this.capturePointerId(e);
      } else {
        // Vertical gesture — let the page scroll.
        this.releasePointer(e);
        return;
      }
    }

    if (!this.isDown) return;
    this.dragOffset = this.dragStartOffset - dx * (this.scrollSpeed * 0.025);
    this.applyTarget();
  }

  onPointerUp(e: PointerEvent) {
    if (this.activePointerId === null || e.pointerId !== this.activePointerId) return;
    this.releasePointer(e);
  }

  onPointerCancel(e: PointerEvent) {
    if (this.activePointerId === null || e.pointerId !== this.activePointerId) return;
    this.releasePointer(e);
  }

  onLostPointerCapture(e: PointerEvent) {
    if (this.activePointerId === null || e.pointerId !== this.activePointerId) return;
    this.releasePointer(e);
  }

  capturePointerId(e: PointerEvent) {
    try {
      this.container.setPointerCapture(e.pointerId);
    } catch {
      // The pointer may already be gone — ignore.
    }
  }

  releasePointer(e: PointerEvent) {
    try {
      if (this.container.hasPointerCapture && this.container.hasPointerCapture(e.pointerId)) {
        this.container.releasePointerCapture(e.pointerId);
      }
    } catch {
      // The pointer may already be gone — ignore.
    }
    const wasDown = this.isDown;
    this.activePointerId = null;
    this.gestureResolved = false;
    this.isDown = false;
    if (wasDown) this.onCheck();
  }

  onWheel(e: Event) {
    const wheelEvent = e as WheelEvent;
    const delta = wheelEvent.deltaY || (wheelEvent as any).wheelDelta || (wheelEvent as any).detail;
    this.dragOffset += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.applyTarget();
    this.onCheckDebounce();
  }

  onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.dragOffset += this.scrollSpeed * 5;
        this.applyTarget();
        this.onCheckDebounce();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.dragOffset -= this.scrollSpeed * 5;
        this.applyTarget();
        this.onCheckDebounce();
        break;

      default:
        break;
    }
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const raw = this.scrollBase + this.dragOffset;
    const itemIndex = Math.round(Math.abs(raw) / width);
    const item = width * itemIndex;
    const snapped = raw < 0 ? -item : item;
    // Only dragOffset is adjusted by the snap — scrollBase stays the host's.
    this.dragOffset = snapped - this.scrollBase;
    this.applyTarget();
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  /** Read-only API surface exposed to the host through apiRef. */
  setScrollBase(base: number) {
    this.scrollBase = base;
    this.applyTarget();
  }

  getItemWidth(): number {
    return this.medias?.[0]?.width ?? 0;
  }

  isDragging(): boolean {
    return this.isDown;
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    window.addEventListener('resize', this.boundOnResize);

    if (this.captureWheel) {
      this.boundOnWheel = this.onWheel.bind(this);
      window.addEventListener('mousewheel', this.boundOnWheel);
      window.addEventListener('wheel', this.boundOnWheel);
    }

    if (this.capturePointer) {
      this.boundOnPointerDown = this.onPointerDown.bind(this);
      this.boundOnPointerMove = this.onPointerMove.bind(this);
      this.boundOnPointerUp = this.onPointerUp.bind(this);
      this.boundOnPointerCancel = this.onPointerCancel.bind(this);
      this.boundOnLostPointerCapture = this.onLostPointerCapture.bind(this);

      this.container.addEventListener('pointerdown', this.boundOnPointerDown);
      this.container.addEventListener('pointermove', this.boundOnPointerMove);
      this.container.addEventListener('pointerup', this.boundOnPointerUp);
      this.container.addEventListener('pointercancel', this.boundOnPointerCancel);
      this.container.addEventListener('lostpointercapture', this.boundOnLostPointerCapture);
    }

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.container?.addEventListener('keydown', this.boundOnKeyDown);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);

    if (this.captureWheel) {
      window.removeEventListener('mousewheel', this.boundOnWheel);
      window.removeEventListener('wheel', this.boundOnWheel);
    }

    if (this.capturePointer) {
      try {
        if (
          this.activePointerId !== null &&
          this.container.hasPointerCapture &&
          this.container.hasPointerCapture(this.activePointerId)
        ) {
          this.container.releasePointerCapture(this.activePointerId);
        }
      } catch {
        // The pointer may already be gone — ignore.
      }
      this.container.removeEventListener('pointerdown', this.boundOnPointerDown);
      this.container.removeEventListener('pointermove', this.boundOnPointerMove);
      this.container.removeEventListener('pointerup', this.boundOnPointerUp);
      this.container.removeEventListener('pointercancel', this.boundOnPointerCancel);
      this.container.removeEventListener('lostpointercapture', this.boundOnLostPointerCapture);
    }

    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas as HTMLCanvasElement);
    }
    if (this.container) {
      this.container.removeEventListener('keydown', this.boundOnKeyDown);
    }
  }
}

/** Imperative surface for a host driving the gallery outside React's render
 *  cycle (e.g. from a ScrollTrigger onUpdate). */
export interface CircularGalleryApi {
  setScrollBase: (base: number) => void;
  getItemWidth: () => number;
  isDragging: () => boolean;
}

interface CircularGalleryProps {
  items?: { image: string; text: string }[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  fontUrl?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  /** Attach window-level wheel/mousewheel listeners. Default true. */
  captureWheel?: boolean;
  /** Attach pointer (drag) listeners, scoped to the container. Default true. */
  capturePointer?: boolean;
  /** Device pixel ratio cap for the renderer. Upstream default is 2. */
  dpr?: number;
  apiRef?: React.MutableRefObject<CircularGalleryApi | null>;
}

export default function CircularGallery({
  items,
  bend = 3,
  textColor = '#ffffff',
  borderRadius = 0.05,
  font = 'bold 30px Figtree',
  fontUrl,
  scrollSpeed = 2,
  scrollEase = 0.05,
  captureWheel = true,
  capturePointer = true,
  dpr,
  apiRef
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    let app: App | undefined;
    let isMounted = true;
    resolveFont(font, fontUrl).then(resolvedFont => {
      if (!isMounted || !containerRef.current) return;
      app = new App(containerRef.current, {
        items,
        bend,
        textColor,
        borderRadius,
        font: resolvedFont,
        scrollSpeed,
        scrollEase,
        captureWheel,
        capturePointer,
        dpr
      });
      if (apiRef) {
        apiRef.current = {
          setScrollBase: base => app?.setScrollBase(base),
          getItemWidth: () => app?.getItemWidth() ?? 0,
          isDragging: () => app?.isDragging() ?? false
        };
      }
    });
    return () => {
      isMounted = false;
      if (app) app.destroy();
      if (apiRef) apiRef.current = null;
    };
  }, [items, bend, textColor, borderRadius, font, fontUrl, scrollSpeed, scrollEase, captureWheel, capturePointer, dpr, apiRef]);
  return (
    <div
      className="circular-gallery"
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Circular image gallery. Use Left and Right Arrow keys to navigate."
    />
  );
}
