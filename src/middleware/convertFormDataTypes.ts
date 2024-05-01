import { Request, Response, NextFunction } from 'express';

const convertFormDataTypes = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log(req.body)
    // Convert "favorited" to boolean if present
    if (req.body.favorited) {
        req.body.favorited = req.body.favorited === 'true';
    }

    // Convert "tags" from a string to an array if necessary
    if (req.body.tags && typeof req.body.tags === 'string') {
        // Assuming tags are sent as a single string separated by commas
        req.body.tags = req.body.tags.split(',');
    }
    // Convert "clothes" from a string to an array if necessary
    if (req.body.clothes && typeof req.body.clothes === 'string') {
        // Assuming clothes are sent as a single string separated by commas
        req.body.clothes = req.body.clothes.split(',');
    }

    // Convert any other specific fields as needed, for example "price" to number
    if (req.body.price && typeof req.body.price === 'string') {
        req.body.price = parseFloat(req.body.price);
    }

    // Additional conversions can be added here as necessary

    next();
};

export default convertFormDataTypes;
