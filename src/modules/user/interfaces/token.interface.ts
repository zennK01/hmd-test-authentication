export type BlackListRefreshToken = {
    token: string;
    reason?: string; // logout, banned, etc
}