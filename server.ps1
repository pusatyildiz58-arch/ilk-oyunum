# Simple HTTP Server for testing
import System.Net
import System.Net.Sockets
import System.Text
import System.IO

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8000/")
$listener.Start()

Write-Host "Server running at http://localhost:8000/"
Write-Host "Press Ctrl+C to stop"

try {
    while ($true) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        $filePath = Join-Path "f:\A) Unity Projeleri\aaaaa" $localPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            
            # Set content type based on file extension
            $ext = [IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html" }
                ".js" { $response.ContentType = "application/javascript" }
                ".css" { $response.ContentType = "text/css" }
                default { $response.ContentType = "application/octet-stream" }
            }
            
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
            $response.ContentType = "text/html"
            $errorHtml = "<html><body><h1>404 - File Not Found</h1><p>$localPath</p></body></html>"
            $errorBytes = [Text.Encoding]::UTF8.GetBytes($errorHtml)
            $response.ContentLength64 = $errorBytes.Length
            $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
        }
        
        $response.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped"
}
