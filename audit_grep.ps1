$results = @{}

function Find-Pattern {
    param($Name, $Pattern, $Path=".")
    $matches = Get-ChildItem -Path $Path -Recurse -Include "*.go","*.ts","*.tsx","*.yaml","*.yml","*.sql" -Exclude "node_modules","dist","build",".git" -ErrorAction SilentlyContinue | Select-String -Pattern $Pattern -ErrorAction SilentlyContinue | Select-Object -Property Path, LineNumber, Line -First 20
    $results[$Name] = $matches
}

Find-Pattern "Hardcoded IP" "\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b" "."
Find-Pattern "Hardcoded Postgres" "postgres://.*" "."
Find-Pattern "Hardcoded Redis" "redis://.*" "."
Find-Pattern "TODOs" "TODO|FIXME|HACK" "."
Find-Pattern "Hardcoded Ports" ":8080|:9000|:8081|:8082|:8083|:8084|:8085|:8091" "."
Find-Pattern "Mock Data Frontend" "mockData|dummy|placeholder" ".\frontend"
Find-Pattern "JWT Secret" "secret" "."
Find-Pattern "Redis Streams" "XADD|XREAD|XCLAIM|XACK|XGROUP|XPENDING" ".\services"
Find-Pattern "WebSockets" "websocket|ws://|wss://" "."
Find-Pattern "Testing" "Test.*\(t \*testing\.T\)" "."
Find-Pattern "RBAC" "role|permission|admin" "."
Find-Pattern "Rate Limit" "rate_limit|ratelimit" "."
Find-Pattern "Security Headers" "helmet|hsts|x-frame-options|csp" "."
Find-Pattern "Distributed Tracing" "otel|opentelemetry|tracer" "."
Find-Pattern "Database Indexes" "CREATE INDEX" ".\services"
Find-Pattern "Missing Foreign Keys" "FOREIGN KEY" ".\services"
Find-Pattern "Error Handling" "panic\(|unhandled" ".\services"

$results | ConvertTo-Json -Depth 3 | Out-File -Encoding utf8 grep_results.json
