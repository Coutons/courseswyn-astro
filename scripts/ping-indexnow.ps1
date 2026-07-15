# IndexNow / Bing URL submission script
# Run this after deploying new/updated content to notify search engines instantly

$apiKey = "ae0e4a5c6da7406e936c045c6abd2e2e"
$baseUrl = "https://courseswyn.com"

# URLs to submit
$urls = @(
    "$baseUrl/blog/best-udemy-agentic-ai-courses-2026/"
)

$body = @{
    host = "courseswyn.com"
    key = $apiKey
    urlList = $urls
} | ConvertTo-Json

Write-Host "== Submitting to IndexNow (Bing/Yandex) =="
Write-Host "URLs: $($urls -join ', ')"

try {
    $response = Invoke-RestMethod -Uri "https://api.indexnow.org/indexnow" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "IndexNow response: $($response | Out-String)"
} catch {
    Write-Host "IndexNow error: $_"
    # Also try direct Bing submission
    foreach ($url in $urls) {
        $encodedUrl = [System.Web.HttpUtility]::UrlEncode($url)
        $bingUrl = "https://www.bing.com/indexnow?url=$encodedUrl&key=$apiKey"
        try {
            $response2 = Invoke-WebRequest -Uri $bingUrl -Method Get -ErrorAction Stop
            Write-Host "Bing IndexNow OK: $url (HTTP $($response2.StatusCode))"
        } catch {
            Write-Host "Bing IndexNow error for $url : $_"
        }
    }
}
