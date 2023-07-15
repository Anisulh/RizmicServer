import { AnyObject } from 'mongoose';
import { IClothingData } from '../clothes/models';
import Color from 'color';

const MONOCHROME_THRESHOLD = 30;
const NEUTRAL_RADIUS = 60;
const EARTH_TONE_THRESHOLD = MONOCHROME_THRESHOLD * 0.5;
const EARTH_TONE_COLORS = [
    Color.rgb(70, 42, 42).lab(), // Dark Brown
    Color.rgb(245, 245, 220).lab(), // Beige
    Color.rgb(210, 180, 140).lab(), // Tan
    Color.rgb(107, 110, 35).lab(), // Olive
    Color.rgb(150, 79, 76).lab(), // Terracotta
    Color.rgb(72, 60, 50).lab(), // Taupe
    Color.rgb(183, 65, 14).lab(), // Rust
    Color.rgb(50, 92, 60).lab(), // Moss Green
    Color.rgb(112, 128, 144).lab(), // Slate Gray
    Color.rgb(181, 101, 29).lab(), // Medium Brown
    Color.rgb(205, 133, 63).lab() // Light Brown
].map((color) => color.array());

// main function that handles the generation, returns an 2D array of clothes
export const algorithm = (
    tops: AnyObject,
    bottoms: AnyObject,
    style: string,
    vibe: string
): IClothingData[][] => {
    try {
        const fits: IClothingData[][] = [];
        for (let i = 0; i < tops.length; i++) {
            for (let j = 0; j < bottoms.length; j++) {
                const isSimilar = checkColorSimilarity(
                    tops[i],
                    bottoms[j],
                    style
                );
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
        const topLAB: any = Color(top.color).rgb().lab();
        const bottomLAB: any = Color(bottom.color).rgb().lab();
        let distance;
        //add more styles here
        switch (style) {
            case 'monochrome':
                distance = Math.sqrt(
                    Math.pow(bottomLAB.color[0] - topLAB.color[0], 2) +
                        Math.pow(bottomLAB.color[1] - topLAB.color[1], 2) +
                        Math.pow(bottomLAB.color[2] - topLAB.color[2], 2)
                );
                return distance <= MONOCHROME_THRESHOLD;
            case 'complimentary':
                const rgb = Color(top.color).rgb().array();
                const invertedRgb = rgb.map((channel: number) => 255 - channel);
                const complimentaryLab: any = Color.rgb(invertedRgb).lab();
                distance = Math.sqrt(
                    Math.pow(bottomLAB[0] - complimentaryLab[0], 2) +
                        Math.pow(bottomLAB[1] - complimentaryLab[1], 2) +
                        Math.pow(bottomLAB[2] - complimentaryLab[2], 2)
                );
                return distance <= MONOCHROME_THRESHOLD;
            case 'neutral':
                distance = Math.sqrt(
                    Math.pow(topLAB.color[1], 2) + Math.pow(topLAB.color[2], 2)
                );
                const isTopNeutral = distance <= NEUTRAL_RADIUS;

                distance = Math.sqrt(
                    Math.pow(bottomLAB.color[1], 2) +
                        Math.pow(bottomLAB.color[2], 2)
                );
                const isBottomNeutral = distance <= NEUTRAL_RADIUS;

                return isTopNeutral && isBottomNeutral;
            case 'earth-tone':
                const topDistance = EARTH_TONE_COLORS.map((color) =>
                    Math.sqrt(
                        Math.pow(color[0] - topLAB.color[0], 2) +
                            Math.pow(color[1] - topLAB.color[1], 2) +
                            Math.pow(color[2] - topLAB.color[2], 2)
                    )
                );
                const isTopEarthTone = topDistance.some(
                    (distance) => distance <= EARTH_TONE_THRESHOLD
                );

                const bottomDistance = EARTH_TONE_COLORS.map((color) =>
                    Math.sqrt(
                        Math.pow(color[0] - bottomLAB.color[0], 2) +
                            Math.pow(color[1] - bottomLAB.color[1], 2) +
                            Math.pow(color[2] - bottomLAB.color[2], 2)
                    )
                );
                const isBottomEarthTone = bottomDistance.some(
                    (distance) => distance <= EARTH_TONE_THRESHOLD
                );

                return isTopEarthTone && isBottomEarthTone;
            default:
                break;
        }
    } catch (error) {
        throw error;
    }
};
