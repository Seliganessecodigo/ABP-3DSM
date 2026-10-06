targetScope = 'resourceGroup'

@description('Azure region for the staging resources.')
param location string = resourceGroup().location

@description('Azure region for the API and its App Service plan.')
param apiLocation string = 'brazilsouth'

@description('Azure region for PostgreSQL.')
param postgresLocation string = 'brazilsouth'

@description('Environment name used to make globally unique resource names.')
param environmentName string = 'greener-staging'

@description('PostgreSQL administrator login. Set a unique value of 1-63 lowercase letters/numbers.')
@minLength(1)
@maxLength(63)
param postgresAdminLogin string = 'greenerops'

@secure()
@description('PostgreSQL administrator password. Supply at deployment time; never commit it.')
param postgresAdminPassword string

@description('Application telemetry daily ingestion cap in GB. Azure accepts whole GB values.')
param telemetryDailyQuotaGb int = 1

var resourceToken = uniqueString(subscription().id, resourceGroup().id, location, environmentName)
var apiResourceToken = uniqueString(subscription().id, resourceGroup().id, apiLocation, environmentName)
var postgresResourceToken = uniqueString(subscription().id, resourceGroup().id, postgresLocation, environmentName)
var globalNameSuffix = substring(resourceToken, 0, 8)
var keyVaultNameSuffix = substring(resourceToken, 0, 7)
var postgresNameSuffix = substring(postgresResourceToken, 0, 8)
var tags = {
  application: 'GreenER'
  environment: 'staging'
  managedBy: 'bicep'
}
var pgFqdn = '${pgServer.name}.postgres.database.azure.com'
var databaseName = 'greener_staging'
var connectionString = 'postgresql://${postgresAdminLogin}:${uriComponent(postgresAdminPassword)}@${pgFqdn}:5432/${databaseName}?sslmode=require'
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'
var keyVaultSecretsOfficerRoleId = 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-greener-staging-eus2'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    workspaceCapping: {
      dailyQuotaGb: telemetryDailyQuotaGb
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-greener-staging-eus2'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    IngestionMode: 'LogAnalytics'
    WorkspaceResourceId: workspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

resource appIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-greener-staging-api'
  location: location
  tags: tags
}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-green-staging-${keyVaultNameSuffix}'
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
    accessPolicies: []
  }
}

resource keyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appIdentity.id, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: appIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource keyVaultSecretsOfficer 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, appIdentity.id, keyVaultSecretsOfficerRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsOfficerRoleId)
    principalId: appIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: 'pg-greener-staging-brs-${postgresNameSuffix}'
  location: postgresLocation
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    version: '17'
    authConfig: {
      activeDirectoryAuth: 'Disabled'
      passwordAuth: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
    storage: {
      storageSizeGB: 32
      autoGrow: 'Disabled'
    }
  }
}

resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: pgServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource pgAzureServicesFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = {
  parent: pgServer
  name: 'allow-azure-services'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource databaseSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'DATABASE-URL'
  properties: {
    value: connectionString
    contentType: 'GreenER PostgreSQL staging DATABASE_URL'
  }
  dependsOn: [
    keyVaultSecretsUser
    keyVaultSecretsOfficer
    pgDatabase
  ]
}

resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'plan-greener-api-staging-brs'
  location: apiLocation
  tags: tags
  kind: 'linux'
  sku: {
    name: 'F1'
    tier: 'Free'
    size: 'F1'
    capacity: 1
  }
  properties: {
    reserved: true
  }
}

resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: 'swa-greener-staging-eus2-${globalNameSuffix}'
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

resource apiApp 'Microsoft.Web/sites@2024-04-01' = {
  name: 'app-greener-api-staging-brs-${substring(apiResourceToken, 0, 8)}'
  location: apiLocation
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${appIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    keyVaultReferenceIdentity: appIdentity.id
    siteConfig: {
      linuxFxVersion: 'NODE|24-lts'
      appCommandLine: 'npm run start:prod'
      alwaysOn: false
      http20Enabled: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      healthCheckPath: '/health'
      cors: {
        allowedOrigins: [
          'https://${staticWebApp.properties.defaultHostname}'
        ]
        supportCredentials: false
      }
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'CORS_ORIGIN'
          value: 'https://${staticWebApp.properties.defaultHostname}'
        }
        {
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(SecretUri=${databaseSecret.properties.secretUri})'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
    }
  }
  dependsOn: [
    keyVaultSecretsUser
    keyVaultSecretsOfficer
    pgAzureServicesFirewall
  ]
}

resource apiDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: apiApp
  name: 'diag-greener-api'
  properties: {
    workspaceId: workspace.id
    logs: [
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output apiUrl string = 'https://${apiApp.properties.defaultHostName}'
output frontendUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output apiAppName string = apiApp.name
output staticWebAppName string = staticWebApp.name
output keyVaultName string = keyVault.name
output postgresServerName string = pgServer.name
output resourceToken string = resourceToken
