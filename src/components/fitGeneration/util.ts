import { AnyObject } from 'mongoose';
import { IClothingData } from '../clothes/models';

const hex2hsl = (hex: string) => {
    // Convert hex to RGB first
    let r = 0,
        g = 0,
        b = 0;
    if (hex.length === 4) {
        r = parseInt('0x' + hex[1] + hex[1], 16);
        g = parseInt('0x' + hex[2] + hex[2], 16);
        b = parseInt('0x' + hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt('0x' + hex[1] + hex[2], 16);
        g = parseInt('0x' + hex[3] + hex[4], 16);
        b = parseInt('0x' + hex[5] + hex[6], 16);
    } else {
        throw new Error('Invalid hex color format');
    }

    // Then convert RGB to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue,
        sat,
        lum = (max + min) / 2;

    if (max === min) {
        hue = sat = 0; // achromatic
    } else {
        const diff = max - min;
        sat = lum > 0.5 ? diff / (2 - max - min) : diff / (max + min);
        switch (max) {
            case r:
                hue = (g - b) / diff + (g < b ? 6 : 0);
                break;
            case g:
                hue = (b - r) / diff + 2;
                break;
            case b:
                hue = (r - g) / diff + 4;
                break;
            default:
                throw new Error('Unable to set hue in hex2hsl');
        }
        hue /= 6;
    }

    hue = Math.round(hue * 360);
    sat = Math.round(sat * 100);
    lum = Math.round(lum * 100);

    return { h: hue, s: sat, l: lum };
};

const rgb2hsl = (r: number, g: number, b: number) => {
    // see https://en.wikipedia.org/wiki/HSL_and_HSV#Formal_derivation
    // convert r,g,b [0,255] range to [0,1]
    (r = r / 255), (g = g / 255), (b = b / 255);
    // get the min and max of r,g,b
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    // lightness is the average of the largest and smallest color components
    let lum = (max + min) / 2;
    let hue;
    let sat;
    if (max == min) {
        // no saturation
        hue = 0;
        sat = 0;
    } else {
        let c = max - min; // chroma
        // saturation is simply the chroma scaled to fill
        // the interval [0, 1] for every combination of hue and lightness
        sat = c / (1 - Math.abs(2 * lum - 1));
        let segment;
        let shift;
        switch (max) {
            case r:
                segment = (g - b) / c;
                shift = 0 / 60; // R° / (360° / hex sides)
                if (segment < 0) {
                    // hue > 180, full rotation
                    shift = 360 / 60; // R° / (360° / hex sides)
                }
                hue = segment + shift;
                break;
            case g:
                segment = (b - r) / c;
                shift = 120 / 60; // G° / (360° / hex sides)
                hue = segment + shift;
                break;
            case b:
                segment = (r - g) / c;
                shift = 240 / 60; // B° / (360° / hex sides)
                hue = segment + shift;
                break;
            default:
                throw new Error('Unable to set hue in rgb2hsl');
        }
    }
    hue = Math.round(hue * 60); // °
    sat = Math.round(sat * 100); // %
    lum = Math.round(lum * 100); // %
    return { h: hue, s: sat, l: lum };
};
const getHSLValues = (color: string) => {
    try {
        const hslRegex = /hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/;
        const rgbRegex =
            /^rgb\((\d{1,2}|1\d{2}|2[0-4]\d|25[0-5]),\s*(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5]),\s*(\d{1,2}|1\d{2}|2[0-4]\d|25[0-5])\)$/;
        const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
        const hslMatch = color.match(hslRegex);
        const rgbMatch = color.match(rgbRegex);
        const hexMatch = color.match(hexRegex);
        if (hslMatch) {
            return {
                h: parseInt(hslMatch[1]),
                s: parseInt(hslMatch[2]) / 100,
                l: parseInt(hslMatch[3]) / 100
            };
        } else if (rgbMatch) {
            const r = parseInt(rgbMatch[1], 10);
            const g = parseInt(rgbMatch[2], 10);
            const b = parseInt(rgbMatch[3], 10);
            return rgb2hsl(r, g, b);
        } else if (hexMatch) {
            return hex2hsl(color);
        } else {
            throw new Error('Invalid color format');
        }
    } catch (error) {
        throw error;
    }
};

export const differenceChecker = (
    style: string,
    top: IClothingData,
    bottom: IClothingData
) => {
    try {
        if (style === 'monochrome') {
            // Get the HSL values of the two colors
            const hsl1 = getHSLValues(top.color);
            const hsl2 = getHSLValues(bottom.color);

            // Check if the difference between the HSL values are within the specified range
            const hDiff = Math.abs(hsl1.h - hsl2.h);
            const sDiff = Math.abs(hsl1.s - hsl2.s);
            const lDiff = Math.abs(hsl1.l - hsl2.l);

            if (hDiff <= 5 && sDiff <= 0.1 * hsl1.s && lDiff <= 0.1 * hsl1.l) {
                return true;
            } else {
                return false;
            }
        } else if (style === 'complimentary') {
            const hsl1 = getHSLValues(top.color);
            const hsl2 = getHSLValues(bottom.color);

            // Check if the difference between the HSL values are within the specified range
            const hDiff = Math.abs(hsl1.h - hsl2.h);
            const sDiff = Math.abs(hsl1.s - hsl2.s);
            const lDiff = Math.abs(hsl1.l - hsl2.l);
            const complementaryDiff = Math.abs(hDiff - 180);

            if (
                complementaryDiff <= 10 &&
                sDiff <= 0.1 * hsl1.s &&
                lDiff <= 0.1 * hsl1.l
            ) {
                return true;
            } else {
                return false;
            }
        }
    } catch (error) {
        throw error;
    }
};

export const algorithm = (
    tops: AnyObject,
    bottoms: AnyObject,
    style: string
) => {
    try {
        const fits: IClothingData[][] = [];
        for (let i = 0; i < tops.length; i++) {
            for (let j = 0; j < bottoms.length; j++) {
                if (differenceChecker(style, tops[i], bottoms[j])) {
                    const matchedFit = [tops[i], bottoms[j]];
                    fits.push(matchedFit);
                }
            }
        }
        return fits;
    } catch (error) {
        throw error;
    }
};
