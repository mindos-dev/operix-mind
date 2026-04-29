import 'dotenv/config';
export declare const env: {
    nodeEnv: "development" | "test" | "production";
    port: number;
    corsOrigin: string;
    jwtSecret: string;
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    uploadMaxBytes: number;
    maxJsonBody: number;
    maxRequestsPerMinute: number;
    maxAiRequestsPerHour: number;
    maxAiTokensPerHour: number;
};
