# create_baseline_repo.ps1

function Create-BaselineRepository {
    param (
        [string]$RepoName = $(Read-Host "Enter the name for the new repository (e.g., MyNewProject)")
    )

    if ([string]::IsNullOrWhiteSpace($RepoName)) {
        Write-Error "Repository name cannot be empty."
        return
    }

    $NewRepoPath = Join-Path (Get-Location).Path $RepoName
    
    Write-Host "Creating new repository at: $NewRepoPath"

    # Create the new repository directory
    New-Item -ItemType Directory -Path $NewRepoPath -Force | Out-Null

    # Navigate into the new directory and initialize Git
    Set-Location $NewRepoPath
    git init | Out-Null
    Write-Host "Initialized empty Git repository in '$NewRepoPath'."

    # Create docs directory and copy BOOTSTRAPPING.md
    $DocsPath = Join-Path $NewRepoPath "docs"
    New-Item -ItemType Directory -Path $DocsPath -Force | Out-Null
    Copy-Item -Path "C:\Users\balap\AgentDraven\BAIC\docs\BOOTSTRAPPING.md" -Destination $DocsPath -Force | Out-Null
    Write-Host "Copied BOOTSTRAPPING.md to '$DocsPath'."

    # Stage and commit the initial BOOTSTRAPPING.md
    git add . | Out-Null
    git commit -m "feat: Initial repository setup with bootstrapping instructions" | Out-Null
    Write-Host "Initial commit created."

    Write-Host "`nRepository '$RepoName' created successfully. To complete the setup:"
    Write-Host "1. Configure your Git user (if not already set globally):"
    Write-Host "   git config user.name "Your Name""
    Write-Host "   git config user.email "your.email@example.com""
    Write-Host "2. Add a remote repository (replace <remote_url> with your actual remote URL):"
    Write-Host "   git remote add origin <remote_url>"
    Write-Host "3. Push the initial commit to the remote:"
    Write-Host "   git branch -M main"
    Write-Host "   git push -u origin main"

    # Return to the original location
    Set-Location C:\Users\balap\AgentDraven\BAIC
}

# Invoke the function
Create-BaselineRepository
