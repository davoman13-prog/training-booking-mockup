SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SchemaMigrations
    (
        MigrationId       int            NOT NULL CONSTRAINT PK_SchemaMigrations PRIMARY KEY,
        MigrationName     nvarchar(200)  NOT NULL,
        AppliedDateUtc    datetime2(0)   NOT NULL CONSTRAINT DF_SchemaMigrations_AppliedDateUtc DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.Organisations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Organisations
    (
        OrganisationId    uniqueidentifier NOT NULL CONSTRAINT PK_Organisations PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        Name              nvarchar(200)    NOT NULL,
        AddressLine1      nvarchar(200)    NULL,
        AddressLine2      nvarchar(200)    NULL,
        Town              nvarchar(100)    NULL,
        Postcode          nvarchar(10)     NULL,
        BillingEmail      nvarchar(320)    NULL,
        Phone             nvarchar(30)     NULL,
        IsActive          bit              NOT NULL CONSTRAINT DF_Organisations_IsActive DEFAULT 1,
        CreatedDateUtc    datetime2(0)     NOT NULL CONSTRAINT DF_Organisations_CreatedDateUtc DEFAULT SYSUTCDATETIME(),
        UpdatedDateUtc    datetime2(0)     NOT NULL CONSTRAINT DF_Organisations_UpdatedDateUtc DEFAULT SYSUTCDATETIME(),
        RowVersion        rowversion       NOT NULL
    );

    CREATE INDEX IX_Organisations_Name ON dbo.Organisations(Name);
END;
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserId              uniqueidentifier NOT NULL CONSTRAINT PK_Users PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        ExternalIdentityId  nvarchar(200)    NOT NULL,
        Email               nvarchar(320)    NOT NULL,
        FirstName           nvarchar(100)    NOT NULL CONSTRAINT DF_Users_FirstName DEFAULT N'',
        LastName            nvarchar(100)    NOT NULL CONSTRAINT DF_Users_LastName DEFAULT N'',
        Phone               nvarchar(30)     NULL,
        Role                varchar(20)      NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'Delegate',
        OrganisationId      uniqueidentifier NULL,
        ManagerName         nvarchar(200)    NULL,
        ManagerEmail        nvarchar(320)    NULL,
        IsActive            bit              NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
        IsAnonymised        bit              NOT NULL CONSTRAINT DF_Users_IsAnonymised DEFAULT 0,
        CreatedDateUtc      datetime2(0)     NOT NULL CONSTRAINT DF_Users_CreatedDateUtc DEFAULT SYSUTCDATETIME(),
        UpdatedDateUtc      datetime2(0)     NOT NULL CONSTRAINT DF_Users_UpdatedDateUtc DEFAULT SYSUTCDATETIME(),
        RowVersion          rowversion       NOT NULL,

        CONSTRAINT UQ_Users_ExternalIdentityId UNIQUE (ExternalIdentityId),
        CONSTRAINT CK_Users_Role CHECK (Role IN ('Delegate', 'Admin')),
        CONSTRAINT FK_Users_Organisations FOREIGN KEY (OrganisationId)
            REFERENCES dbo.Organisations(OrganisationId)
    );

    CREATE INDEX IX_Users_Email ON dbo.Users(Email);
    CREATE INDEX IX_Users_OrganisationId ON dbo.Users(OrganisationId);
END;
GO

IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLog
    (
        AuditLogId       bigint            NOT NULL IDENTITY(1,1) CONSTRAINT PK_AuditLog PRIMARY KEY,
        UserId           uniqueidentifier  NULL,
        Action           varchar(100)      NOT NULL,
        EntityType       varchar(50)       NOT NULL,
        EntityId         uniqueidentifier  NULL,
        Details          nvarchar(max)     NULL,
        CreatedDateUtc   datetime2(0)      NOT NULL CONSTRAINT DF_AuditLog_CreatedDateUtc DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_AuditLog_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(UserId)
    );

    CREATE INDEX IX_AuditLog_Entity ON dbo.AuditLog(EntityType, EntityId, CreatedDateUtc DESC);
    CREATE INDEX IX_AuditLog_UserId ON dbo.AuditLog(UserId, CreatedDateUtc DESC);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE MigrationId = 1)
BEGIN
    INSERT INTO dbo.SchemaMigrations (MigrationId, MigrationName)
    VALUES (1, N'001_create_foundation.sql');
END;
GO
