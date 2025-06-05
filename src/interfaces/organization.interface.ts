import { OrganizationType, OrganizationStatus } from '@/constants/organization.constants';
import { AuthenticatedUserResponse } from './user.interface'; // For admin user details

/**
 * @openapi
 * components:
 *   schemas:
 *     OrganizationRegistrationRequest:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - contactPersonName
 *         - contactPersonEmail
 *       properties:
 *         name:
 *           type: string
 *           description: Official name of the organization.
 *           example: City General Hospital
 *         type:
 *           $ref: '#/components/schemas/OrganizationTypeEnum'
 *         licenseNumber:
 *           type: string
 *           nullable: true
 *           description: Official license number of the organization.
 *           example: LIC-HOSP-12345
 *         address:
 *           type: string
 *           nullable: true
 *           description: Physical address of the organization.
 *           example: 123 Health St, Anytown, USA
 *         contactPersonName:
 *           type: string
 *           description: Full name of the primary contact person for this organization.
 *           example: Dr. Jane Smith
 *         contactPersonEmail:
 *           type: string
 *           format: email
 *           description: Email address of the primary contact person. This will be used to create their admin account upon approval.
 *           example: jane.smith@citygeneral.com
 *         contactPersonMobile:
 *           type: string
 *           nullable: true
 *           description: Mobile number of the primary contact person.
 *           example: "+15551237890"
 * 
 *     OrganizationFullResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/OrganizationResponse'
 *         - type: object
 *           properties:
 *             adminUser:
 *               $ref: '#/components/schemas/AuthenticatedUserResponse'
 *               nullable: true
 *             rejectionReason:
 *               type: string
 *               nullable: true
 *               description: Reason for rejection, if applicable.
 *             approvedByUserId:
 *               type: string
 *               format: uuid
 *               nullable: true
 *               description: ID of the system admin who approved/rejected.
 *             approvedAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *               description: Timestamp of approval/rejection.
 */

export interface Organization {
    id: string;
    name: string;
    type: OrganizationType;
    licenseNumber?: string | null;
    licenseDocumentS3Path?: string | null;
    address?: string | null;
    contactPersonName: string;
    contactPersonEmail: string;
    contactPersonMobile?: string | null;
    status: OrganizationStatus;
    adminUserId?: string | null; // ID of the User who is the admin for this org
    rejectionReason?: string | null;
    approvedBy?: string | null; // ID of System Admin who approved
    approvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateOrganizationDto = Omit<Organization, 'id' | 'status' | 'adminUserId' | 'rejectionReason' | 'approvedBy' | 'approvedAt' | 'createdAt' | 'updatedAt' | 'licenseDocumentS3Path'>;

// For responses that might include the admin user details
export interface OrganizationWithAdmin extends Organization {
    adminUser?: AuthenticatedUserResponse | null;
}