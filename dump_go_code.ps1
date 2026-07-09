$Output = "e:\AIML_Projects\iicpc_benchforge\go_code_dump.txt"
$Paths = @("e:\AIML_Projects\iicpc_benchforge\services", "e:\AIML_Projects\iicpc_benchforge\pkg", "e:\AIML_Projects\iicpc_benchforge\internal", "e:\AIML_Projects\iicpc_benchforge\cmd")
Clear-Content $Output -ErrorAction SilentlyContinue

foreach ($Path in $Paths) {
    if (Test-Path $Path) {
        $Files = Get-ChildItem -Path $Path -Recurse -Filter "*.go"
        foreach ($File in $Files) {
            $Header = "`n`n--- FILE: " + $File.FullName + " ---`n"
            Add-Content -Path $Output -Value $Header -Encoding utf8
            $Content = Get-Content $File.FullName -Raw
            Add-Content -Path $Output -Value $Content -Encoding utf8
        }
    }
}
