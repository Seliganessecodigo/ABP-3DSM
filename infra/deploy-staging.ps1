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

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$resourceGroupJson = az group show --name $ResourceGroupName --subscription $subscriptionId --output json 2>$null
$resourceGroupLookupExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference
$resourceGroup = if ($resourceGroupLookupExitCode -eq 0) { $resourceGroupJson | ConvertFrom-Json } else { $null }
if (-not $resourceGroup) {
  az group create --name $ResourceGroupName --location $location --subscription $subscriptionId --tags application=GreenER environment=staging managedBy=bicep --only-show-errors --output none
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the staging resource group.' }
}

$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
  $characterGroups = @(
    'abcdefghijklmnopqrstuvwxyz'
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    '0123456789'
    '!#$%&()*+,-./:;<=>?@[]^_{|}~'
  )
  $characterPool = $characterGroups -join ''
  $passwordCharacters = [System.Collections.Generic.List[char]]::new()
  foreach ($group in $characterGroups) {
    $randomIndex = [byte[]]::new(1)
    $rng.GetBytes($randomIndex)
    $passwordCharacters.Add($group[$randomIndex[0] % $group.Length])
  }
  $extraRandom = [byte[]]::new(28)
  $rng.GetBytes($extraRandom)
  foreach ($randomByte in $extraRandom) {
    $passwordCharacters.Add($characterPool[$randomByte % $characterPool.Length])
  }
  $shuffleBytes = [byte[]]::new($passwordCharacters.Count)
  $rng.GetBytes($shuffleBytes)
  for ($index = $passwordCharacters.Count - 1; $index -gt 0; $index--) {
    $swapIndex = $shuffleBytes[$index] % ($index + 1)
    $temporary = $passwordCharacters[$index]
    $passwordCharacters[$index] = $passwordCharacters[$swapIndex]
    $passwordCharacters[$swapIndex] = $temporary
  }
  $plainPassword = -join $passwordCharacters
  $securePassword = ConvertTo-SecureString $plainPassword -AsPlainText -Force
}
finally {
  $rng.Dispose()
}
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$temporaryParametersFile = Join-Path $env:TEMP ("greener-staging-$([guid]::NewGuid().ToString('N')).parameters.json")
try {
  $deploymentParameters = Get-Content -Raw $parametersPath | ConvertFrom-Json
  $deploymentParameters.parameters | Add-Member -MemberType NoteProperty -Name postgresAdminPassword -Value @{ value = $plainPassword }
  $temporaryFileStream = [System.IO.File]::Create($temporaryParametersFile)
  $temporaryFileStream.Dispose()
  $fileAcl = Get-Acl $temporaryParametersFile
  $fileAcl.SetAccessRuleProtection($true, $false)
  $currentUserSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
  $fileAcl.SetAccessRule([System.Security.AccessControl.FileSystemAccessRule]::new($currentUserSid, 'FullControl', 'Allow'))
  Set-Acl -Path $temporaryParametersFile -AclObject $fileAcl
  [System.IO.File]::WriteAllText($temporaryParametersFile, ($deploymentParameters | ConvertTo-Json -Depth 10))

  if ($PreviewOnly) {
    az deployment group what-if --resource-group $ResourceGroupName --subscription $subscriptionId --template-file $templatePath --parameters "@$temporaryParametersFile" --result-format ResourceIdOnly
  } else {
    $deploymentJson = az deployment group create --name "greener-staging-$(Get-Date -Format yyyyMMddHHmmss)" --resource-group $ResourceGroupName --subscription $subscriptionId --template-file $templatePath --parameters "@$temporaryParametersFile" --only-show-errors --output json
    if ($LASTEXITCODE -eq 0) {
      $deployment = $deploymentJson | ConvertFrom-Json
      $deployment.properties.outputs | ConvertTo-Json -Depth 5
    }
  }
  if ($LASTEXITCODE -ne 0) { throw 'Azure deployment failed. Review the Azure CLI output before retrying.' }
}
finally {
  Remove-Item -LiteralPath $temporaryParametersFile -Force -ErrorAction SilentlyContinue
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  $plainPassword = $null
  $securePassword = $null
}
