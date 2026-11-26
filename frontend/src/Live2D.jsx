import React, { useEffect, useRef, useState } from 'react';

export default function Live2D({ emotion = "neutral", onInteract }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const modelRef = useRef(null);
  const emotionRef = useRef(emotion);
  emotionRef.current = emotion;
  const applyExpressionRef = useRef(null);
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;
  const lastTapRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let app = null;
    let model = null;
    let onResize = null;
    let removeTap = null;

    async function init() {
      try {
        const PIXI = await import('pixi.js');
        if (cancelled) return;
        window.PIXI = PIXI;
        const { Live2DModel } = await import('pixi-live2d-display/cubism4');
        if (cancelled) return;
        if (!window.Live2DCubismCore) {
          throw new Error('Thiếu Live2D Cubism Core. Hãy kiểm tra kết nối Internet.');
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const url = '/character/' + encodeURIComponent('长离.model3.json');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Không tìm thấy model Changli tại models/character/长离.model3.json');
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('json')) {
          throw new Error('Vite chưa phục vụ file model JSON. Kiểm tra models/character/长离.model3.json và khởi động lại npm run dev.');
        }
        const config = await response.json();
        if (!config.FileReferences || !config.FileReferences.Moc) {
          throw new Error('File model3.json không đúng cấu trúc Live2D Cubism 4.');
        }
        if (cancelled) return;
        app = new PIXI.Application({ view: canvas, resizeTo: canvas.parentElement, backgroundAlpha: 0, autoStart: true, antialias: true });
        model = await Live2DModel.from(url);
        if (cancelled) return;
        app.stage.addChild(model);
        modelRef.current = model;
        const applyExpression = (name) => {
          const manager = model.internalModel?.motionManager?.expressionManager;
          if (!manager) { console.warn('[Changli] Expression manager unavailable'); return; }
          try {
            if (name === 'neutral') manager.resetExpression?.();
            else manager.setExpression?.(name);
            console.log('[Changli] expression:', name);
          } catch (err) { console.warn('[Changli] expression failed', name, err); }
        };
        applyExpressionRef.current = applyExpression;
        applyExpression(emotionRef.current);
        // Use canvas pointer coordinates, not Pixi model hit bounds.
        const handleTap = (event) => {
          const now = Date.now();
          if (now - lastTapRef.current < 250) return;
          const rect = canvas.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          if (x < 0.18 || x > 0.82 || y < 0.07 || y > 0.96) return;
          lastTapRef.current = now;
          const zone = y < 0.31 ? 'head' : y < 0.55 ? 'cheek' : 'shoulder';
          console.log('[Changli] touch:', zone, x.toFixed(2), y.toFixed(2));
          onInteractRef.current?.(zone);
        };
        canvas.addEventListener('pointerup', handleTap);
        removeTap = () => canvas.removeEventListener('pointerup', handleTap);
        onResize = () => {
          if (!app || !model || !app.renderer) return;
          const w = app.renderer.width, h = app.renderer.height;
          // Show Changli from head to chest, cropping the lower body.
          // Use unscaled model dimensions so resizing never compounds the zoom.
          model.scale.set(1);
          const naturalWidth = model.width;
          const naturalHeight = model.height;
          if (!naturalWidth || !naturalHeight || !w || !h) return;
          // Show approximately the upper 34% of the model (head to chest).
          const visibleBodyFraction = 0.34;
          const s = h / (naturalHeight * visibleBodyFraction);
          model.scale.set(s);
          model.x = (w - model.width) / 2;
          model.y = h * 0.015;
        };
        onResize();
        window.addEventListener('resize', onResize);
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e));
      }
    }
    init();
    return () => {
      cancelled = true;
      modelRef.current = null;
      applyExpressionRef.current = null;
      if (onResize) window.removeEventListener('resize', onResize);
      removeTap?.();
      // PixiJS owns the model once it is attached to the stage.
      // Destroy only the application, not both model and application.
      try { if (app && app.renderer) app.destroy(true, { children: true, texture: false, baseTexture: false }); }
      catch (e) { console.warn('Live2D cleanup:', e); }
    };
  }, []);

  useEffect(() => {
    applyExpressionRef.current?.(emotion);
  }, [emotion]);

  return <div className="avatar"><canvas ref={canvasRef} style={{pointerEvents:"auto"}} />{error && <div className="model-error">{error}<div>Khung chat vẫn dùng được.</div></div>}</div>;
}
