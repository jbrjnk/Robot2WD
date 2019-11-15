./build.ps1

$exitCode = $LASTEXITCODE
  if($exitCode -eq 0){Write-Host "Build completed" -ForegroundColor Green;}
  else {Write-Host "Build failed" -ForegroundColor Red; Exit 1;}           

./flash.ps1

$exitCode = $LASTEXITCODE
  if($exitCode -eq 0){Write-Host "Flash completed" -ForegroundColor Green;}
  else {Write-Host "Flash failed" -ForegroundColor Red; Exit 1;}           

Write-Host "Build and flash completed" -ForegroundColor Green;
