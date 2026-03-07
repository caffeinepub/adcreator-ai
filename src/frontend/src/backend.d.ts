import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export enum BusinessType {
    gym = "gym",
    retail = "retail",
    cafe = "cafe",
    salon = "salon",
    restaurant = "restaurant"
}
export interface backendInterface {
    generateAd(businessType: BusinessType, city: string, promotion: string, discount: bigint | null): Promise<string>;
}
