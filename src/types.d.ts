declare namespace Express {
    export interface Request {
        user: any;
        newToken: boolean;
        tokenExpiry: number;
    }
    export interface Response {
        user: any;
    }
}
