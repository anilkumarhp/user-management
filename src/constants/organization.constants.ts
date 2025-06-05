export enum OrganizationType {
    HOSPITAL = 'HOSPITAL',
    PHARMACY = 'PHARMACY',
    LAB = 'LAB',
}

export enum OrganizationStatus {
    PENDING_VERIFICATION = 'PENDING_VERIFICATION',
    ACTIVE = 'ACTIVE',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
}

export const ALL_ORGANIZATION_TYPES: string[] = Object.values(OrganizationType);
export const ALL_ORGANIZATION_STATUSES: string[] = Object.values(OrganizationStatus);