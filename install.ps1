<#
  Get Your Life Together - bootstrap (Windows / PowerShell)

  Run this ONCE right after cloning, BEFORE /setup:

    git clone https://github.com/Zoomma1/get-your-life-together my-vault
    cd my-vault
    .\install.ps1

  What it does: creates the Claude Code slash-command stubs in
  <claude home>\commands\ so that /setup (and every other skill)
  becomes invocable. Without this step /setup cannot be called on a
  fresh clone - the stubs live in your home directory, not in the repo.

  Zero dependencies beyond git + PowerShell. Idempotent: safe to
  re-run, existing stubs are left untouched.
#>

$ErrorActionPreference = 'Stop'

# --- Vault path = directory this script lives in (the cloned repo) ---
$VaultPath = $PSScriptRoot

# --- Claude home: honour CLAUDE_CONFIG_DIR, else platform default ---
if ($env:CLAUDE_CONFIG_DIR) {
    $ClaudeHome = $env:CLAUDE_CONFIG_DIR
} else {
    $ClaudeHome = Join-Path $env:USERPROFILE '.claude'
}

$SkillsDir   = Join-Path $VaultPath '99 - Claude Code\Skills'
$CommandsDir = Join-Path $ClaudeHome 'commands'

if (-not (Test-Path -LiteralPath $SkillsDir)) {
    Write-Error "Skills folder not found at: $SkillsDir`nRun this script from inside the cloned vault."
    exit 1
}

New-Item -ItemType Directory -Force -Path $CommandsDir | Out-Null

$created = 0
$skipped = 0

# Single-quoted templates: backticks / $ in descriptions stay literal,
# placeholders are filled with the -f operator (no re-parsing).
$richTpl = @'
---
description: {0}
---
Read the {1} skill from `{2}\99 - Claude Code\Skills\{1}\SKILL.md` and execute it.
'@

$minTpl = @'
Read the {0} skill from `{1}\99 - Claude Code\Skills\{0}\SKILL.md` and execute it.
'@

foreach ($dir in Get-ChildItem -LiteralPath $SkillsDir -Directory) {
    $skillFile = Join-Path $dir.FullName 'SKILL.md'
    if (-not (Test-Path -LiteralPath $skillFile)) { continue }
    $name = $dir.Name
    $stub = Join-Path $CommandsDir "$name.md"

    if (Test-Path -LiteralPath $stub) {
        $skipped++
        continue
    }

    # First `description:` line of the skill's YAML frontmatter.
    $descLine = Select-String -LiteralPath $skillFile -Pattern '^description:' |
                Select-Object -First 1
    $desc = $null
    if ($descLine) {
        $desc = $descLine.Line -replace '^description:\s*', ''
    }

    if ($desc) {
        $content = $richTpl -f $desc, $name, $VaultPath
    } else {
        $content = $minTpl -f $name, $VaultPath
    }
    $content += [Environment]::NewLine

    # UTF-8 without BOM, identical across PowerShell 5.1 and 7
    # (Set-Content -Encoding utf8 adds a BOM on 5.1).
    [System.IO.File]::WriteAllText(
        $stub, $content, (New-Object System.Text.UTF8Encoding $false))
    $created++
}

Write-Host ''
Write-Host 'Get Your Life Together - bootstrap done.'
Write-Host "  Claude home : $ClaudeHome"
Write-Host "  Stubs       : $created created, $skipped already present"
Write-Host ''
Write-Host 'Next steps:'
Write-Host "  1. Don't have Claude Code yet? Get it at https://claude.ai/code and sign in."
Write-Host '  2. In Claude Code, from this folder, run:  /setup'
Write-Host '  3. Then every morning:  /today'
Write-Host ''
