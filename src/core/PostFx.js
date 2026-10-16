// Optional bloom (FR30): EffectComposer + RenderPass + UnrealBloomPass + OutputPass.
// Only constructed for a real WebGLRenderer; Renderer never builds it in Node tests.
import { Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class PostFx {
  constructor(glRenderer, scene, camera, { enabled = true, strength = 0.75, radius = 0.4, threshold = 0.62 } = {}) {
    this.gl = glRenderer;
    this.scene = scene;
    this.camera = camera;
    this.enabled = false;
    this.composer = null;
    if (!enabled) return;
    try {
      this.composer = new EffectComposer(glRenderer);
      this.composer.addPass(new RenderPass(scene, camera));
      this.bloom = new UnrealBloomPass(new Vector2(256, 256), strength, radius, threshold);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
      this.enabled = true;
    } catch (err) {
      // Recoverable: fall back to the plain renderer.
      console.warn('[PostFx] bloom unavailable, using plain rendering:', err);
      this.composer = null;
      this.enabled = false;
    }
  }

  resize(width, height, dpr = 1) {
    if (!this.composer) return;
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);
  }

  render() {
    if (this.enabled && this.composer) this.composer.render();
    else this.gl.render(this.scene, this.camera);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.composer?.dispose?.();
    this.composer = null;
  }
}
