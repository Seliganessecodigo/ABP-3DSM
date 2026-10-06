param(
  [switch] $PreviewOnly,
  [string] $ResourceGroupName = 'azrggreenerstaging'
)

$ErrorActionPreference = 'Stop'
$subscriptionId = '12692f32-f4bd-4549-b1f4-2d0c0fcf13aa'
$tenantId = 'eabe64c5-68f5-4a76-8301-9577a679e449'
$location = 'eastus2'
$templatePath = Join-Path $PSScriptRoot 'main.bicep'
$parametersPath = Join-Path $PSScriptRoot 'main.parameters.json'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
  throw 'Azure CLI is required. Install it from https://learn.microsoft.com/cli/azure/install-azure-cli.'
}

$account = az account show --subscription $subscriptionId --output json 2>$null | ConvertFrom-Json
if (-not $account -or $account.id -ne $subscriptionId -or $account.tenantId -ne $tenantId) {
  throw "Azure CLI is not authenticated to the Azure for Students subscription ($subscriptionId, tenant $tenantId). Run 'az login --tenant $tenantId' and retry. No resources were changed."
}

az bicep install
if ($LASTEXITCODE -ne 0) { throw 'Could not install or update the Bicep CLI.' }
az bicep build --file $templatePath --outfile (Join-Path $env:TEMP 'greener-staging-main.json')
if ($LASTEXITCODE -ne 0) { throw 'Bicep compilation failed; no Azure resources were changed.' }

$resourceGroup = az group show --name $ResourceGroupName --subscription $subscriptionId --output json 2>$null | ConvertFrom-Json
if (-not $resourceGroup) {
  az group create --name $ResourceGroupName --location $location --subscription $subscriptionId --tags application=GreenER environment=staging managedBy=bicep --only-show-errors --output none
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the staging resource group.' }
}

$securePassword = Read-Host 'PostgreSQL staging admin password (not saved to disk)' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $env:GREEN_ER_DB_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  if ($PreviewOnly) {
    az deployment group what-if --resource-group $ResourceGroupName --subscription $subscriptionId --template-file $templatePath --parameters "@$parametersPath" "postgresAdminPassword=$env:GREEN_ER_DB_ADMIN_PASSWORD" --result-format ResourceIdOnly
  } else {
    az deployment group create --name "greener-staging-$(Get-Date -Format yyyyMMddHHmmss)" --resource-group $ResourceGroupName --subscription $subscriptionId --template-file $templatePath --parameters "@$parametersPath" "postgresAdminPassword=$env:GREEN_ER_DB_ADMIN_PASSWORD" --only-show-errors --output json
  }
  if ($LASTEXITCODE -ne 0) { throw 'Azure deployment failed. Review the Azure CLI output before retrying.' }
}
finally {
  Remove-Item Env:\GREEN_ER_DB_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}
