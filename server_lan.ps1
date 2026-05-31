$port = 5173
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()

Write-Host "Servidor corriendo en TCP (LAN y Localhost) en el puerto $port"
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Ethernet', 'Wi-Fi' -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.16.*" } | Select-Object -ExpandProperty IPAddress -First 1)
if ($ip) {
    Write-Host "Para probar en otro dispositivo (celular, tablet), usa esta URL:" -ForegroundColor Yellow
    Write-Host "http://$ip`:$port/" -ForegroundColor Green
} else {
    Write-Host "No se pudo detectar la IP local. Intenta usar ipconfig."
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        
        # Read the request line
        $requestLine = $reader.ReadLine()
        if ([string]::IsNullOrWhiteSpace($requestLine)) {
            $client.Close()
            continue
        }
        
        $parts = $requestLine -split ' '
        if ($parts.Length -lt 2) {
            $client.Close()
            continue
        }
        
        $url = $parts[1]
        
        # Read headers until empty line
        while ($true) {
            $header = $reader.ReadLine()
            if ([string]::IsNullOrEmpty($header)) { break }
        }
        
        $localPath = $url.Split('?')[0]
        if ($localPath -eq "/") { $localPath = "/index.html" }
        $localPath = $localPath -replace '\.\.', ''
        
        $filePath = Join-Path $pwd ($localPath -replace '/', '\')
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/plain"
            switch ($ext) {
                ".html" { $contentType = "text/html" }
                ".css" { $contentType = "text/css" }
                ".js" { $contentType = "application/javascript" }
                ".png" { $contentType = "image/png" }
                ".svg" { $contentType = "image/svg+xml" }
            }
            
            $headerString = "HTTP/1.1 200 OK`r`nContent-Type: $contentType; charset=utf-8`r`nContent-Length: $($content.Length)`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerString)
            
            try {
                $stream.Write($headerBytes, 0, $headerBytes.Length)
                $stream.Write($content, 0, $content.Length)
            } catch {
                # Ignore write errors (e.g., client disconnected early)
            }
        } else {
            $headerString = "HTTP/1.1 404 Not Found`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerString)
            try { $stream.Write($headerBytes, 0, $headerBytes.Length) } catch {}
        }
        
        $client.Close()
    }
} finally {
    $listener.Stop()
}
