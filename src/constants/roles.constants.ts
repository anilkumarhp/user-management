export enum UserRoles {
    PATIENT = 'PATIENT',
    HOSPITAL_ADMIN = 'HOSPITAL_ADMIN',
    DOCTOR = 'DOCTOR',
    NURSE = 'NURSE',
    STAFF = 'STAFF', // Generic staff role for organizations
    PHARMA_ADMIN = 'PHARMA_ADMIN',
    LAB_ADMIN = 'LAB_ADMIN',
    SYSTEM_ADMIN = 'SYSTEM_ADMIN', 
}

// Array of all roles, can be useful for validation or iteration
export const ALL_ROLES: string[] = Object.values(UserRoles);