/** Load an Image with soft retries. */
export function loadImageWithRetry(
  src,
  { retries = 1, delayMs = 500, crossOrigin = 'anonymous' } = {},
) {
  return new Promise((resolve, reject) => {
    let left = retries;
    const tryLoad = () => {
      const img = new Image();
      if (crossOrigin) img.crossOrigin = crossOrigin;
      img.onload = () => resolve(img);
      img.onerror = () => {
        if (left > 0) {
          left -= 1;
          setTimeout(tryLoad, delayMs);
        } else {
          reject(new Error(`Failed to load ${src}`));
        }
      };
      img.src = src;
    };
    tryLoad();
  });
}

/**
 * THREE.TextureLoader load with soft retry.
 * @param {{ load: Function }} loader
 * @param {string} url
 * @param {(tex: unknown) => void} onLoad
 * @param {() => void} onFinalFail
 */
export function loadTextureWithRetry(
  loader,
  url,
  onLoad,
  onFinalFail,
  { retries = 1, delayMs = 500 } = {},
) {
  let left = retries;
  const tryLoad = () => {
    loader.load(
      url,
      onLoad,
      undefined,
      () => {
        if (left > 0) {
          left -= 1;
          setTimeout(tryLoad, delayMs);
        } else {
          onFinalFail?.();
        }
      },
    );
  };
  tryLoad();
}
