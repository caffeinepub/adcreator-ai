import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface Ad {
    id: bigint;
    tone: string;
    businessName: string;
    platform: string;
    captionShort: string;
    imageUrl?: string;
    savedAt: bigint;
    captionLong: string;
}
export interface UserWithAds {
    principal: Principal;
    name: string;
    adCount: bigint;
    registeredAt: bigint;
}
export interface Feedback {
    id: bigint;
    userName: string;
    userEmail: string;
    submittedAt: bigint;
    message: string;
}
export interface UpdateAdsInput {
    ads: Array<Ad>;
}
export interface AdminAnalytics {
    totalAdsGenerated: bigint;
    platformCounts: Array<{
        count: bigint;
        platform: string;
    }>;
    totalImagesGenerated: bigint;
    topBusinessTypes: Array<{
        count: bigint;
        businessType: string;
    }>;
    activeUsersToday: bigint;
    weeklyActivity: Array<{
        day: string;
        count: bigint;
    }>;
    totalUsers: bigint;
}
export interface DailyUsageStats {
    count: bigint;
    resetAt: bigint;
    limit: bigint;
}
export interface SaveAdInput {
    tone: string;
    businessName: string;
    platform: string;
    captionShort: string;
    imageUrl?: string;
    captionLong: string;
}
export enum BusinessType {
    gym = "gym",
    retail = "retail",
    cafe = "cafe",
    salon = "salon",
    restaurant = "restaurant"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAd(adId: bigint): Promise<void>;
    generateAd(businessType: BusinessType, city: string, promotion: string, discount: bigint | null): Promise<string>;
    getAdminAnalytics(): Promise<AdminAnalytics>;
    getAdsForCaller(): Promise<Array<Ad>>;
    getAllFeedback(): Promise<Array<Feedback>>;
    getAllUsersForAdmin(): Promise<Array<UserWithAds>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyUsage(): Promise<DailyUsageStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveAd(input: SaveAdInput): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitFeedback(email: string, message: string): Promise<void>;
    updateAllAds(input: UpdateAdsInput): Promise<void>;
}
