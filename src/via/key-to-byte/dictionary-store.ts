import basicKeyToByte from './default';
import v10BasicKeyToByte from './v10';
import v11BasicKeyToByte from './v11';
import v12BasicKeyToByte from './v12';
import v13BasicKeyToByte from './v13';

export function getBasicKeyDict(
  protocol: number,
  keycodesVersion?: number,
): Record<string, number> {
  if (protocol >= 13) {
    if (keycodesVersion === undefined) {
      throw new Error(
        `VIA protocol ${protocol} requires a QMK keycodes version`,
      );
    }
    return v13BasicKeyToByte;
  }

  switch (protocol) {
    case 12: {
      return v12BasicKeyToByte;
    }
    case 11: {
      return v11BasicKeyToByte;
    }
    case 10: {
      return v10BasicKeyToByte;
    }
    default: {
      return basicKeyToByte;
    }
  }
}
