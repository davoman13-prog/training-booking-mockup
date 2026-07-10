import sql from 'mssql'
import { getDatabasePool } from '../shared/database'
import { AuthenticatedPrincipal } from '../shared/auth'

export type ApplicationRole = 'Delegate' | 'Admin'

export interface ApplicationUser {
  userId: string
  externalIdentityId: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: ApplicationRole
  organisationId: string | null
  managerName: string | null
  managerEmail: string | null
  isActive: boolean
  isAnonymised: boolean
  profileComplete: boolean
}

interface UserRow {
  UserId: string
  ExternalIdentityId: string
  Email: string
  FirstName: string
  LastName: string
  Phone: string | null
  Role: ApplicationRole
  OrganisationId: string | null
  ManagerName: string | null
  ManagerEmail: string | null
  IsActive: boolean
  IsAnonymised: boolean
}

function mapUser(row: UserRow): ApplicationUser {
  return {
    userId: row.UserId,
    externalIdentityId: row.ExternalIdentityId,
    email: row.Email,
    firstName: row.FirstName,
    lastName: row.LastName,
    phone: row.Phone,
    role: row.Role,
    organisationId: row.OrganisationId,
    managerName: row.ManagerName,
    managerEmail: row.ManagerEmail,
    isActive: row.IsActive,
    isAnonymised: row.IsAnonymised,
    profileComplete: Boolean(row.FirstName && row.LastName),
  }
}

export async function findOrCreateUser(principal: AuthenticatedPrincipal): Promise<ApplicationUser> {
  const pool = await getDatabasePool()
  const transaction = new sql.Transaction(pool)

  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE)

  try {
    const request = new sql.Request(transaction)
      .input('ExternalIdentityId', sql.NVarChar(200), principal.providerUserId)
      .input('Email', sql.NVarChar(320), principal.email)

    const existing = await request.query<UserRow>(`
      SELECT TOP (1)
        UserId,
        ExternalIdentityId,
        Email,
        FirstName,
        LastName,
        Phone,
        Role,
        OrganisationId,
        ManagerName,
        ManagerEmail,
        IsActive,
        IsAnonymised
      FROM dbo.Users WITH (UPDLOCK, HOLDLOCK)
      WHERE ExternalIdentityId = @ExternalIdentityId;
    `)

    let row = existing.recordset[0]

    if (!row) {
      const inserted = await new sql.Request(transaction)
        .input('ExternalIdentityId', sql.NVarChar(200), principal.providerUserId)
        .input('Email', sql.NVarChar(320), principal.email)
        .query<UserRow>(`
          INSERT INTO dbo.Users (
            ExternalIdentityId,
            Email,
            FirstName,
            LastName,
            Role,
            IsActive,
            IsAnonymised,
            CreatedDateUtc,
            UpdatedDateUtc
          )
          OUTPUT
            inserted.UserId,
            inserted.ExternalIdentityId,
            inserted.Email,
            inserted.FirstName,
            inserted.LastName,
            inserted.Phone,
            inserted.Role,
            inserted.OrganisationId,
            inserted.ManagerName,
            inserted.ManagerEmail,
            inserted.IsActive,
            inserted.IsAnonymised
          VALUES (
            @ExternalIdentityId,
            @Email,
            N'',
            N'',
            'Delegate',
            1,
            0,
            SYSUTCDATETIME(),
            SYSUTCDATETIME()
          );
        `)

      row = inserted.recordset[0]
    } else if (row.Email !== principal.email) {
      const updated = await new sql.Request(transaction)
        .input('UserId', sql.UniqueIdentifier, row.UserId)
        .input('Email', sql.NVarChar(320), principal.email)
        .query<UserRow>(`
          UPDATE dbo.Users
          SET Email = @Email,
              UpdatedDateUtc = SYSUTCDATETIME()
          OUTPUT
            inserted.UserId,
            inserted.ExternalIdentityId,
            inserted.Email,
            inserted.FirstName,
            inserted.LastName,
            inserted.Phone,
            inserted.Role,
            inserted.OrganisationId,
            inserted.ManagerName,
            inserted.ManagerEmail,
            inserted.IsActive,
            inserted.IsAnonymised
          WHERE UserId = @UserId;
        `)

      row = updated.recordset[0]
    }

    await transaction.commit()
    return mapUser(row)
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
