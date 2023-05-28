import { AnyObject } from 'mongoose';
import { IClothingData } from '../clothes/models';
import Color from 'color';

const monochromeThreshold = 30;

export const algorithm = (
    tops: AnyObject,
    bottoms: AnyObject,
    style: string
) => {
    try {
        const fits: IClothingData[][] = [];
        for (let i = 0; i < tops.length; i++) {
            for (let j = 0; j < bottoms.length; j++) {
                const isSimilar = checkColorSimilarity(
                    tops[i],
                    bottoms[j],
                    style
                );
                console.log(tops[i].color, bottoms[i].color, isSimilar);
                if (isSimilar) {
                    const matchedFit = [tops[i]._id, bottoms[j]._id];
                    fits.push(matchedFit);
                }
            }
        }
        return fits;
    } catch (error) {
        throw error;
    }
};

const checkColorSimilarity = (
    top: IClothingData,
    bottom: IClothingData,
    style: string
): boolean | undefined => {
    try {
        console.log(top.color, bottom.color);
        const topLAB: any = Color(top.color).rgb().lab();
        const bottomLAB: any = Color(bottom.color).rgb().lab();
        let distance;
        switch (style) {
            case 'monochrome':
                distance = Math.sqrt(
                    Math.pow(bottomLAB.color[0] - topLAB.color[0], 2) +
                        Math.pow(bottomLAB.color[1] - topLAB.color[1], 2) +
                        Math.pow(bottomLAB.color[2] - topLAB.color[2], 2)
                );
                console.log(distance);
                return distance <= monochromeThreshold;
            case 'complimentary':
                const rgb = Color(top.color).rgb().array();
                const invertedRgb = rgb.map((channel: number) => 255 - channel);
                const complimentaryLab: any = Color.rgb(invertedRgb).lab();
                distance = Math.sqrt(
                    Math.pow(bottomLAB[0] - complimentaryLab[0], 2) +
                        Math.pow(bottomLAB[1] - complimentaryLab[1], 2) +
                        Math.pow(bottomLAB[2] - complimentaryLab[2], 2)
                );
                return distance <= monochromeThreshold;
            default:
                break;
        }
    } catch (error) {
        throw error;
    }
};
