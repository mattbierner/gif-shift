import { Renderer } from '.';
import { Document } from '../model/document';

export async function exportGif(existingRenderer: Renderer, doc: Document): Promise<string> {
    const { GifEncoder } = await import(`../gifencoder`);

    const { width, height } = doc;
    const encoder = new GifEncoder({ width, height });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const renderer = new Renderer(canvas);
    renderer.clone(existingRenderer);

    const frameCount = doc.frameCount;
    for (let i = 0; i < frameCount; ++i) {
        const imageData = new ImageData(new Uint8ClampedArray(renderer.renderToBuffer({ frame: i })), width, height);
        const delay = (doc.getFrame(i)?.info.delay ?? 3) * 10;
        encoder.addFrame(imageData, delay);
    }

    return new Promise<string>(resolve => {
        encoder.once('finished', (blob: Blob) => {
            encoder.dispose();
            const url = URL.createObjectURL(blob);
            resolve(url);
            // URL.revokeObjectURL(url); // TODO: maybe do this after a delay?
        });

        encoder.render();
    });
}
