  $exitCode = 0;
  
  for($i=0;$i -lt 3;$i++) {
  C:\Users\Jan\AppData\Local\Programs\Python\Python36-32\Scripts\esptool.py.exe    `
                 --port COM3 `
                 --baud 460800 `
                 write_flash `
                 --verify `
                 0x0 out\\firmware\\0x00000.bin `
                 0x9000 out\\firmware\\0x9000.bin `
                 0x100000 out\\firmware\\spiff_rom.bin `
                #  0x3FB000 D:\\VirtualLubuntuEspressif\\share\\ESP\\ESP8266_NONOS_SDK\\bin\\blank.bin `
                #  0x3FC000 D:\\VirtualLubuntuEspressif\\share\\ESP\\ESP8266_NONOS_SDK\\bin\\esp_init_data_default.bin `
                #  0x3FE000 D:\\VirtualLubuntuEspressif\\share\\ESP\\ESP8266_NONOS_SDK\\bin\\blank.bin
    $exitCode = $LASTEXITCODE
    if($exitCode -eq 0){Write-Host "SUCCESS"       -ForegroundColor Green; Exit 0;}
    else {Write-Host "Error" ", retry." -ForegroundColor Red}
  }
  
  Write-Host "Failed, exit code " $exitCode;
  Exit 1;
