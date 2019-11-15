  chcp 65001
  rm out/firmware/spiff_rom.bin
  bash -c "make"
  $exitCode = $LASTEXITCODE
  if($exitCode -eq 0){Write-Host "SUCCESS" -ForegroundColor Green; Exit 0;}
  else {Write-Host "FAILED" -ForegroundColor Red; Exit 1;}
