import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Book {
    id: string;
    title: string;
    isPublished: boolean;
    coverImageId: ExternalBlob;
    publishedAt?: bigint;
    description: string;
    author: Principal;
    genre: string;
    priceCents: bigint;
}
export interface ShortFilm {
    id: string;
    title: string;
    duration: bigint;
    isPublished: boolean;
    thumbnailId: ExternalBlob;
    publishedAt?: bigint;
    description: string;
    director: Principal;
    genre: string;
    videoId: ExternalBlob;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface PurchaseRecord {
    id: string;
    bookId: string;
    purchasedAt: bigint;
    totalAmountCents: bigint;
    creatorPrincipal: Principal;
    buyerPrincipal: Principal;
    stripePaymentIntentId: string;
    creatorShareCents: bigint;
    adminShareCents: bigint;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    name: string;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPurchase(purchase: PurchaseRecord): Promise<void>;
    approveContent(id: string, contentType: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRole(user: Principal, role: UserRole): Promise<void>;
    claimFirstAdmin(): Promise<boolean>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createStripeCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string, config: StripeConfiguration): Promise<string>;
    deleteBook(id: string): Promise<void>;
    deleteShortFilm(id: string): Promise<void>;
    editBook(id: string, book: Book): Promise<void>;
    editShortFilm(id: string, film: ShortFilm): Promise<void>;
    fetchBooks(): Promise<Array<Book>>;
    fetchShortFilms(): Promise<Array<ShortFilm>>;
    getAllBooks(): Promise<Array<Book>>;
    getAllPublishedContent(): Promise<{
        shortFilms: Array<ShortFilm>;
        books: Array<Book>;
    }>;
    getAllPurchases(): Promise<Array<PurchaseRecord>>;
    getAllShortFilms(): Promise<Array<ShortFilm>>;
    getBook(id: string): Promise<Book | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyBooks(): Promise<Array<Book>>;
    getMyEarnings(): Promise<bigint>;
    getMyPurchases(): Promise<Array<PurchaseRecord>>;
    getMyShortFilms(): Promise<Array<ShortFilm>>;
    getPublishedBooks(): Promise<Array<Book>>;
    getPublishedShortFilms(): Promise<Array<ShortFilm>>;
    getPurchasesByBuyer(buyer: Principal): Promise<Array<PurchaseRecord>>;
    getPurchasesByCreator(creator: Principal): Promise<Array<PurchaseRecord>>;
    getShortFilm(id: string): Promise<ShortFilm | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasAdminBeenAssigned(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    rejectContent(id: string, contentType: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitBook(book: Book): Promise<void>;
    submitShortFilm(film: ShortFilm): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
