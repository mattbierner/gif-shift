export const getMaxTextureSize = (() => {
    let value: number | undefined;

    return (): number => {
        if (typeof value !== 'number') {
            value = 4096;
            try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl')!;
                value = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            } catch (e) {
                // noop
            }
        }
        return value!;
    };
})();
