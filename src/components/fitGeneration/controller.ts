import { Request, Response } from 'express';
import { symbol } from 'joi';
import Clothes from '../clothes/models';

export const generateFit = async (
    style: string,
    req: Request,
    res: Response
) => {
    /*
    1) get the color of clothing
    2) if color format is not HSL 
    then :      
        Convert color format to HSL
    3) Complimentry: given hsl(20, 100%, 80%), we get the complimentary of hsl(20, 100%, 80%)
    then do the hsl(x+- 5, y+-10%, z+-10%) and sto re in array. 
    Then check to see if other clothes have a hsl() value that corresponds to the value in the array
    */
    //    const { _id } = req.user;
    //    const getColor = req.params.color;
    //    const colorDocument : string | null = await Clothes.find({color});
    //     if (colorDocument){
    //         const color : string | null = await Clothes.find({color});
    //     }
    // let color: any;
    // var vals = color
    //     .substring(color.indexOf('(') + 1, color.length - 1)
    //     .split(', ');
    // var r = vals[0];
    // var g = vals[1];
    // var b = vals[2];

    // const rgbtoHSL = (r: number, g: number, b: number) => {
    //     (r /= 255), (g /= 255), (b /= 255);
    //     var max = Math.max(r, g, b),
    //         min = Math.min(r, g, b);
    //     var h = (max + min) / 2,
    //         s = (max + min) / 2,
    //         l = (max + min) / 2;

    //     if (max == min) {
    //         h = s = 0; //achromatic
    //     } else {
    //         var d = max - min;
    //         s = l > 0.5 ? d / (2.0 - max - min) : d / (max + min);

    //         if (max == r && g >= b) {
    //             h = (1.0472 * (g - b)) / d;
    //         } else if (max == r && g < b) {
    //             h = (1.0472 * (g - b)) / d + 6.2832;
    //         } else if (max == g) {
    //             h = (1.0472 * (b - r)) / d + 2.0944;
    //         } else if (max == b) {
    //             h = (1.0472 * (r - g)) / d + 4.1888;
    //         }
    //     }

    //     h = (h / 6.2832) * 360.0 + 0;

    //     // Shift hue to opposite side of wheel and convert to [0-1] value
    //     h += 180;
    //     if (h > 360) {
    //         h -= 360;
    //     }
    //     h /= 360;
    //     return [h, s, l];
    // };
    // console.log(rgbtoHSL(r, g, b));

    //Assuming we have an array of top and bottoms
    let tops: [];
    let bottoms: [];

    const differenceChecker = (
        style: string,
        tops: string,
        bottoms: string
    ) => {
        const getHSLValues = (color: string) => {
            const hslRegex = /hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/;
            const matches = color.match(hslRegex);
            if (matches) {
                return {
                    h: parseInt(matches[1]),
                    s: parseInt(matches[2]) / 100,
                    l: parseInt(matches[3]) / 100
                };
            } else {
                return {
                    h: 0,
                    s: 0,
                    l: 0
                };
            }
        };

        if (style === 'monochrome') {
            // Get the HSL values of the two colors
            const hsl1 = getHSLValues(tops);
            const hsl2 = getHSLValues(bottoms);

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
            const hsl1 = getHSLValues(tops);
            const hsl2 = getHSLValues(bottoms);

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
    };

    const algorithm = (tops: [], bottoms: []) => {
        for (let i = 0; i < tops.length; i++) {
            for (let j = 0; j < bottoms.length; j++) {
                if (differenceChecker(style, tops[i], bottoms[j])) {
                    return true; //makes the fit
                }
            }
        }
    };
};
