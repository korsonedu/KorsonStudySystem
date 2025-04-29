# 移动src目录下的所有文件到frontend/src
Get-ChildItem -Path "src" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Item "src").FullName.Length)
    $targetPath = Join-Path "frontend\src" $relativePath
    
    if ($_.PSIsContainer) {
        # 如果是目录，创建目标目录
        if (!(Test-Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath | Out-Null
        }
    } else {
        # 如果是文件，复制到目标位置
        $targetDir = Split-Path -Parent $targetPath
        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir | Out-Null
        }
        Copy-Item -Path $_.FullName -Destination $targetPath -Force
    }
}

# 移动public目录下的所有文件到frontend/public
Get-ChildItem -Path "public" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Item "public").FullName.Length)
    $targetPath = Join-Path "frontend\public" $relativePath
    
    if ($_.PSIsContainer) {
        # 如果是目录，创建目标目录
        if (!(Test-Path $targetPath)) {
            New-Item -ItemType Directory -Path $targetPath | Out-Null
        }
    } else {
        # 如果是文件，复制到目标位置
        $targetDir = Split-Path -Parent $targetPath
        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir | Out-Null
        }
        Copy-Item -Path $_.FullName -Destination $targetPath -Force
    }
}

# 移动根目录下的前端配置文件
$frontendFiles = @(
    "index.html",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "README.md",
    ".gitignore",
    ".eslintrc.js"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Copy-Item -Path $file -Destination "frontend\" -Force
    }
}

Write-Host "前端文件已成功移动到frontend文件夹"
