export const Canvas = 'Canvas' as const;
export const Group = 'Group' as const;
export const Line = 'Line' as const;
export const Rect = 'Rect' as const;
export const Text = 'Text' as const;
export const Path = 'Path' as const;
export const Circle = 'Circle' as const;

export function matchFont() {
  return {};
}

export const Skia = {
  Path: {
    MakeFromSVGString: () => ({}),
    Make: () => ({
      moveTo: () => {},
      lineTo: () => {},
      close: () => {},
    }),
  },
};
