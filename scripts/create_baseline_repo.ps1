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

    # Navigate into the new directory
    Set-Location $NewRepoPath

    # Ensure .env.local and cfg directory exist
    $EnvFilePath = Join-Path $NewRepoPath ".env.local"
    $CfgPath = Join-Path $NewRepoPath "cfg"
    New-Item -ItemType Directory -Path $CfgPath -Force | Out-Null
    New-Item -ItemType File -Path $EnvFilePath -Force | Out-Null

    # Read existing .env.local for values
    $EnvContent = Get-Content $EnvFilePath -Raw -ErrorAction SilentlyContinue
    $EnvVars = @{}
    if ($EnvContent) {
        $EnvContent.Split("`n") | ForEach-Object {
            if ($_ -match "^\s*([^=]+?)\s*=\s*(.*)\s*$") {
                $EnvVars[$matches[1]] = $matches[2]
            }
        }
    }

    # Configure Git User Name
    $GitUserName = "AgentDraven"
    git config user.name "$GitUserName" | Out-Null
    Write-Host "Configured Git user.name as '$GitUserName'."

    # Configure Git User Email
    $GitUserEmail = $EnvVars["GIT_USER_EMAIL"]
    if ([string]::IsNullOrWhiteSpace($GitUserEmail)) {
        $GitUserEmail = Read-Host "Enter your Git email address"
        Add-Content -Path $EnvFilePath -Value "GIT_USER_EMAIL=$GitUserEmail"
    }
    git config user.email "$GitUserEmail" | Out-Null
    Write-Host "Configured Git user.email as '$GitUserEmail'."

    # Configure GitHub Token/Password
    $GitHubToken = $EnvVars["GITHUB_TOKEN"]
    if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
        $GitHubToken = Read-Host -AsSecureString "Enter your GitHub Personal Access Token or Password (will be saved in .env.local)" | ConvertFrom-SecureString | ConvertTo-Plaintext
        Add-Content -Path $EnvFilePath -Value "GITHUB_TOKEN=$GitHubToken"
    }
    # For HTTPS remote, we'll embed the token in the URL for automatic authentication
    # This is a common practice for CI/CD or automated scripts, but be aware of security implications.

    # Initialize Git Repository
    git init | Out-Null
    Write-Host "Initialized empty Git repository in \'$NewRepoPath\'."

    # Create docs directory and copy BOOTSTRAPPING.md
    $DocsPath = Join-Path $NewRepoPath "docs"
    New-Item -ItemType Directory -Path $DocsPath -Force | Out-Null
    Copy-Item -Path "C:\\Users\\balap\\AgentDraven\\BAIC\\docs\\BOOTSTRAPPING.md" -Destination $DocsPath -Force | Out-Null
    Write-Host "Copied BOOTSTRAPPING.md to \'$DocsPath\'."

    # Add remote repository
    $RemoteUrl = "https://${GitUserName}:${GitHubToken}@github.com/${GitUserName}/${RepoName}.git"
    git remote add origin $RemoteUrl | Out-Null
    Write-Host "Added remote repository: $RemoteUrl"

    # Stage and commit the initial BOOTSTRAPPING.md
    git add . | Out-Null
    git commit -m "feat: Initial repository setup with bootstrapping instructions" | Out-Null
    Write-Host "Initial commit created."

    # Push to remote
    git branch -M main | Out-Null
    git push -u origin main | Out-Null
    Write-Host "Pushed initial commit to remote."

    Write-Host "`nRepository \'$RepoName\' created and bootstrapped successfully."
    Write-Host "Your Git email and GitHub token/password have been saved in \'.env.local\' in the new repository."

    # Return to the original location
    Set-Location C:\\Users\\balap\\AgentDraven\\BAIC
}

# Invoke the function
Create-BaselineRepository