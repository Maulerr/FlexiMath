$port = 5173
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Servidor en ejecucin en http://localhost:$port/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        # Avoid directory traversal trivially
        $localPath = $localPath -replace '\.\.', ''
        
        $filePath = Join-Path $pwd $localPath
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/plain"
            switch ($ext) {
                ".html" { $contentType = "text/html" }
                ".css" { $contentType = "text/css" }
                ".js" { $contentType = "application/javascript" }
                ".png" { $contentType = "image/png" }
                ".svg" { $contentType = "image/svg+xml" }
            }
            $response.ContentType = "$contentType; charset=utf-8"
            
            try {
                $response.OutputStream.Write($content, 0, $content.Length)
            } catch {
                # Ignore connection dropped
            }
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
