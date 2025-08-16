#!/bin/bash

# Quick Commands for Mockup Iteration
# Usage: source quick-commands.sh

# Quick save current state
alias save='git add . && git commit -m'

# Example: save "added new calculator"

# See last 10 versions
alias versions='git log --oneline -10'

# Go back one version
alias back='git reset --hard HEAD~1'

# Go back N versions (usage: backto 3)
backto() {
    git reset --hard HEAD~$1
}

# See what changed in last commit
alias changes='git diff HEAD~1'

# Create experiment branch
alias experiment='git checkout -b'

# Return to main after experiment
alias main='git checkout master'

# Quick status
alias status='git status -s'

# Show current version
alias current='git log --oneline -1'

# Create a named checkpoint (usage: checkpoint "before-major-change")
checkpoint() {
    git tag -a "$1" -m "Checkpoint: $1"
    echo "✅ Checkpoint created: $1"
}

# List all checkpoints
alias checkpoints='git tag -l'

# Jump to checkpoint (usage: goto "before-major-change")
goto() {
    git checkout "$1"
}

echo "✨ Quick commands loaded!"
echo ""
echo "Commands available:"
echo "  save 'message'    - Save current state"
echo "  versions          - Show last 10 versions"
echo "  back              - Go back one version"
echo "  backto N          - Go back N versions"
echo "  changes           - See what changed"
echo "  checkpoint 'name' - Create named checkpoint"
echo "  goto 'name'       - Jump to checkpoint"
echo "  status            - Quick status"
echo ""
echo "Current version:"
git log --oneline -1